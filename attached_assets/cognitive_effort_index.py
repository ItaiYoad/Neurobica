# -*- coding: utf-8 -*-
"""
@author: NeuroBrave
this code  is distributed under BSD licence.

this code requires: 
    active internet conenction 
    subscription to NeuroSpeed.io service.
    active EEG stream from neuroSpeed cloud.
"""


GRAPH_ENGAGEMENT = False

from pathlib import Path
import os

from neurospeed.auth.auth_as_user_handler import Auth_AS_User_Handler
from neurospeed.api_socket_handlers.user_room_as_user_handler import UserRoom_AS_User_Handler
from neurospeed.utils.helper_service import UtilService

global user_auth



import statistics
import queue
import time
from vispy import gloo, app, visuals
import numpy as np
import math
from seaborn import color_palette
from scipy.signal import lfilter, lfilter_zi
from mne.filter import create_filter

import socket
import json

stream_q_EEG = queue.Queue(-1)


VERT_SHADER = """
#version 120
// y coordinate of the position.
attribute float a_position;
// row, col, and time index.
attribute vec3 a_index;
varying vec3 v_index;
// 2D scaling factor (zooming).
uniform vec2 u_scale;
// Size of the table.
uniform vec2 u_size;
// Number of samples per signal.
uniform float u_n;
// Color.
attribute vec3 a_color;
varying vec4 v_color;
// Varying variables used for clipping in the fragment shader.
varying vec2 v_position;
varying vec4 v_ab;
void main() {
    float n_rows = u_size.x;
    float n_cols = u_size.y;
    // Compute the x coordinate from the time index.
    float x = -1 + 2*a_index.z / (u_n-1);
    vec2 position = vec2(x - (1 - 1 / u_scale.x), a_position);
    // Find the affine transformation for the subplots.
    vec2 a = vec2(1./n_cols, 1./n_rows)*.9;
    vec2 b = vec2(-1 + 2*(a_index.x+.5) / n_cols,
                    -1 + 2*(a_index.y+.5) / n_rows);
    // Apply the static subplot transformation + scaling.
    gl_Position = vec4(a*u_scale*position+b, 0.0, 1.0);
    v_color = vec4(a_color, 1.);
    v_index = a_index;
    // For clipping test in the fragment shader.
    v_position = gl_Position.xy;
    v_ab = vec4(a, b);
}
"""

FRAG_SHADER = """
#version 120
varying vec4 v_color;
varying vec3 v_index;
varying vec2 v_position;
varying vec4 v_ab;
void main() {
    gl_FragColor = v_color;
    // Discard the fragments between the signals (emulate glMultiDrawArrays).
    if ((fract(v_index.x) > 0.) || (fract(v_index.y) > 0.))
        discard;
    // Clipping test.
    vec2 test = abs((v_position.xy-v_ab.zw)/v_ab.xy);
    if ((test.x > 1))
        discard;
}
"""


global UPDATE_TIMER
UPDATE_TIMER = 1.5

window_title = "use mouse wheel for vertical zoom, +/- keys for horizontal zoom. D key toggles high pass filter"

class Canvas(app.Canvas):
    def __init__(self, stream_info, scale=1000, filt=True):
        app.Canvas.__init__(self, title=window_title, keys='interactive')   
        window = 10
        
        self.sfreq = stream_info['srate']
        self.n_chans = stream_info['n_chans']
        ch_names = stream_info['ch_names']
        
        
        n_samples = int(self.sfreq * window)


        # Number of cols and rows in the table.
        n_rows = self.n_chans
        n_cols = 1

        # Number of signals.
        m = n_rows * n_cols

        # Number of samples per signal.
        n = n_samples

        # Various signal amplitudes.
        amplitudes = np.zeros((m, n)).astype(np.float32)
        # gamma = np.ones((m, n)).astype(np.float32)
        # Generate the signals as a (m, n) array.
        y = amplitudes

        color = color_palette("RdBu_r", n_rows)

        color = np.repeat(color, n, axis=0).astype(np.float32)
        # Signal 2D index of each vertex (row and col) and x-index (sample index
        # within each signal).
        index = np.c_[np.repeat(np.repeat(np.arange(n_cols), n_rows), n),
                      np.repeat(np.tile(np.arange(n_rows), n_cols), n),
                      np.tile(np.arange(n), m)].astype(np.float32)

        self.program = gloo.Program(VERT_SHADER, FRAG_SHADER)
        self.program['a_position'] = y.reshape(-1, 1)
        self.program['a_color'] = color
        self.program['a_index'] = index
        self.program['u_scale'] = (1., 1.)
        self.program['u_size'] = (n_rows, n_cols)
        self.program['u_n'] = n

        # text
        self.font_size = 24.
        self.names = []
        self.quality = []
        for ii in range(self.n_chans):
            text = visuals.TextVisual(ch_names[ii], bold=True, color='white')
            self.names.append(text)
            text = visuals.TextVisual('', bold=True, color='white')
            self.quality.append(text)

        self.quality_colors = color_palette("RdYlGn", 11)[::-1]

        self.scale = scale
        self.n_samples = n_samples
        self.filt = filt
        self.af = [1.0]

        self.data_f = np.zeros((n_samples, self.n_chans))
        self.data = np.zeros((n_samples, self.n_chans))

        self.bf = create_filter(self.data_f.T, self.sfreq, None, 10.,
                                method='fir')

        zi = lfilter_zi(self.bf, self.af)
        self.filt_state = np.tile(zi, (self.n_chans, 1)).transpose()

        self._timer = app.Timer(UPDATE_TIMER, connect=self.on_timer, start=True)
        
        gloo.set_viewport(0, 0, *self.physical_size)
        gloo.set_state(clear_color='black', blend=True,
                       blend_func=('src_alpha', 'one_minus_src_alpha'))
        self.show()

    def on_key_press(self, event):

        # toggle filtering
        if event.key.name == 'D':
            self.filt = not self.filt

        # increase time scale
        if event.key.name in ['+', '-']:
            if event.key.name == '+':
                dx = -0.05
            else:
                dx = 0.05
            scale_x, scale_y = self.program['u_scale']
            scale_x_new, scale_y_new = (scale_x * math.exp(1.0 * dx),
                                        scale_y * math.exp(0.0 * dx))
            self.program['u_scale'] = (
                max(1, scale_x_new), max(1, scale_y_new))
            self.update()

    def on_mouse_wheel(self, event):
        dx = np.sign(event.delta[1]) * .05
        scale_x, scale_y = self.program['u_scale']
        scale_x_new, scale_y_new = (scale_x * math.exp(0.0 * dx),
                                    scale_y * math.exp(2.0 * dx))
        self.program['u_scale'] = (max(1, scale_x_new), max(0.01, scale_y_new))
        self.update()

    def on_timer(self, event):
        """Add some data at the end of each signal (real-time signals)."""       
        samples = stream_q_EEG.get(timeout = 1)
            # samples = [[-1 for j in range(self.n_chans)  ] for i in range(int(self.sfreq * UPDATE_TIMER))]      
        
        if True:
            samples = np.array(samples)[:, ::-1]

            self.data = np.vstack([self.data, samples])
            self.data = self.data[-self.n_samples:]
            filt_samples, self.filt_state = lfilter(self.bf, self.af, samples,
                                                    axis=0, zi=self.filt_state)
            self.data_f = np.vstack([self.data_f, filt_samples])
            self.data_f = self.data_f[-self.n_samples:]

            if self.filt:
                plot_data = self.data_f / self.scale
            elif not self.filt:
                plot_data = (self.data - self.data.mean(axis=0)) / self.scale

            sd = np.std(plot_data[-int(self.sfreq):],
                        axis=0)[::-1] * self.scale
            co = np.int32(np.tanh((sd - 30) / 15) * 5 + 5)
            for ii in range(self.n_chans):
                self.quality[ii].text = '%.2f' % (sd[ii])
                self.quality[ii].color = self.quality_colors[co[ii]]
                self.quality[ii].font_size = 12 + co[ii]

                self.names[ii].font_size = 12 + co[ii]
                self.names[ii].color = self.quality_colors[co[ii]]

            self.program['a_position'].set_data(
                plot_data.T.ravel().astype(np.float32))
            self.update()

    def on_resize(self, event):
        # Set canvas viewport and reconfigure visual transforms to match.
        vp = (0, 0, self.physical_size[0], self.physical_size[1])
        self.context.set_viewport(*vp)

        for ii, t in enumerate(self.names):
            t.transforms.configure(canvas=self, viewport=vp)
            t.pos = (self.size[0] * 0.025,
                     ((ii + 0.5) / self.n_chans) * self.size[1])

        for ii, t in enumerate(self.quality):
            t.transforms.configure(canvas=self, viewport=vp)
            t.pos = (self.size[0] * 0.975,
                     ((ii + 0.5) / self.n_chans) * self.size[1])

    def on_draw(self, event):
        gloo.clear()
        gloo.set_viewport(0, 0, *self.physical_size)
        self.program.draw('line_strip')
        [t.draw() for t in self.names + self.quality]





global EEG_sensor_information
EEG_sensor_information=None
global delta_wave_history
delta_wave_history = []

def EEG_processing_handler1(payload):
    
    '''
    this function is being called every time a packet arrives, depending on confifguration of the HIA source; usually this is once per second.
    the code extracts the useful sensor information that comes with every packet, but does it just one time to be elegant and not keep overwriting the EEG_sensor_information variable   
    
    this function exracts cognitive effort index based on research:
    
    Gvion, Shahaf (2021): "Real-time monitoring of barriers to patient engagement for imporved rehabilitation: a protocol and representative case reports"
    link to this article: https://doi.org/10.1080/17483107.2021.1929513
    
    thanks to Neurospeed, the implementation of engagement index is few lines of code. 
    
    the data is then oversampled 100x and put on queue for collection by the graphing function. 
    the graphing function is called by a timer, collects the data from queue and plots it graphically.
    
     '''  
     
    global delta_wave_history
    global EEG_sensor_information    
    if EEG_sensor_information == None:
        EEG_sensor_information = {}
        EEG_sensor_information["EEG_channel_names"] = payload["sensor_info"]["channel_map"]
        EEG_sensor_information["EEG_channel_num"] = len(payload["sensor_info"]["channel_map"])    
        EEG_sensor_information["sampling_frequency"] = payload["sensor_info"]["sampling_frequency"]



    # electrode_select is a list of EEG electrodes to be included in the calculation of the cognitive effort index. 
    # if a single electrode is desired, create a list with a single value:
    #  if all available electrodes are to be included, use this:
    # electrode_select = "all"
    electrode_select = [0]
      
    
    
    if "all" in electrode_select:
        delta_wave_power = statistics.mean(payload["output"]['brainwave_power']['delta_wave'])
    else:
        delta_wave_power = statistics.mean([payload["output"]['brainwave_power']['delta_wave'][electrode_index] for electrode_index in electrode_select])
    
    delta_wave_history.append(delta_wave_power)
    if len(delta_wave_history) > 20: 
        del delta_wave_history[0]
    
    cognitive_effort_index = statistics.stdev(delta_wave_history) / statistics.mean(delta_wave_history)   
    
    if len(delta_wave_history)< 20:
        print("filling buffer for calculation, please stand by...")
    else: 
        print("engagement value: ", cognitive_effort_index)
        if delta_wave_history>1.0: 
            print("value above 1.0 generally indicates noisy data!")
        
    
    if GRAPH_ENGAGEMENT: 
        values = []
        for i in range(100):
            values.append([cognitive_effort_index])
        stream_q_EEG.put(values, timeout = 1)

  


def EEG_processing_handler2(payload):
    # your implementation
    # print('EEG_processing_handler2')
    pass
    
def customer_gamepad_msg_handler_function(payload):
    # your implementation
    print('customer_gamepad_msg_handler_function')
    pass

def customer_user_data_msg_handler_function(payload):
    # your implementation
    print('customer_user_data_msg_handler_function')
    pass

generic_handler = { # allows multiple handlers for each device
    'eeg': [ EEG_processing_handler1, EEG_processing_handler2],
    'gamepad': [customer_gamepad_msg_handler_function],
    'user_data': [customer_user_data_msg_handler_function]
}



def user_data_external_handler(payload):
    username = user_auth.get_username()
    stream_id = payload["stream_id"]
    device_type = payload["device_type"]
    hia_id = payload["hia_id"]
    sensor_info = payload["sensor_info"]
    # print("data from user: {} hia: {} stream_id: {} device_type: {}".format(username, hia_id, stream_id, device_type))
    
    # execute each function handler for relevant device_type
    device_type = device_type.lower()
    handler_functions = generic_handler[device_type]
    for func in handler_functions:
        func(payload)
    
# see README(4) for payload structure  
def user_device_event_external_handler(payload):
    print('event: ', payload)
    pass;



# Hint: you can set "Verbose_socket_log": "True" in user config to enable more logging
def main():
    global user_auth

    user1_config_path = os.path.join(str(Path().absolute()) ,"config\\","hia_config1.json")
    print(user1_config_path)
    config_user1 = UtilService.load_config_file(user1_config_path)


    # Authenticate as user
    user_auth = Auth_AS_User_Handler(config_user1)
    user_auth.login()

    userRoom = UserRoom_AS_User_Handler(user_auth)
    userRoom.set_data_external_handler(user_data_external_handler)
    userRoom.set_device_events_external_handler(user_device_event_external_handler)

    userRoom.connect()
    



    time.sleep(5)
    print(EEG_sensor_information)
    
    if GRAPH_ENGAGEMENT: 
        stream_info = {'n_chans': 1,'srate': 100  , 'ch_names': ["engamement"]    }
        Canvas(stream_info)
        app.run()



    

if __name__ == '__main__':    
    main()  