'''
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
import time

driver = webdriver.Chrome("C:\\author_data\\chromedriver\\95\\chromedriver.exe")  # Optional argument, if not specified will search path.
driver.get("https://web.whatsapp.com/")
wait = WebDriverWait(driver, 600)
# Replace 'Friend's Name' with the name of your friend
# or the name of a group
target = '"You"'
# Replace the below string with your own message
message = "Message sent using Python!!!"
 
x_arg = '//span[contains(@title,' + target + ')]'
group_title = wait.until(EC.presence_of_element_located((
    By.XPATH, x_arg)))
group_title.click()
inp_xpath = '//div[@class="_13NKt copyable-text selectable-text"][@data-tab="9"]'
input_box = wait.until(EC.presence_of_element_located((
    By.XPATH, inp_xpath)))

input_box.send_keys(message + Keys.ENTER)
driver.quit()

'''



# -*- coding: utf-8 -*-
"""
@author: NeuroBrave
this code  is distributed under BSD licence.

this code requires: 
    active internet conenction 
    subscription to NeuroSpeed.io service.
    active EEG stream from neuroSpeed cloud.
"""


GRAPH_ENGAGEMENT = True

from pathlib import Path
import os

from neurospeed.auth.auth_as_user_handler import Auth_AS_User_Handler
from neurospeed.api_socket_handlers.user_room_as_user_handler import UserRoom_AS_User_Handler
from neurospeed.utils.helper_service import UtilService
import time
import pywhatkit as whatsapp
import keyboard

global user_auth
global is_tab_open
is_tab_open = False

global EEG_sensor_information
global first_disctraction_time
global distraction_count
distraction_count = 0

EEG_sensor_information=None

def send_whatsapp(message):
    global is_tab_open    
    if not is_tab_open:
        whatsapp.sendwhatmsg_instantly("+972545862021", message, wait_time=10)
        is_tab_open=True
        time.sleep(0.1)
    else:
        # using whatsapp toolkit only required for the first time to open the browser window
        # after that we're typing and sending the message manually to make it quiker. 
        # please note that the browswer window must remain active for the script to work. 
        keyboard.write(message)
        time.sleep(0.2)
        keyboard.press_and_release('enter')
    print("is tab open? ", is_tab_open)

def EEG_processing_handler1(payload):
    
    '''
    this function is being called every time a packet arrives, depending on confifguration of the HIA source; usually this is once per second.
    the code extracts the useful sensor information that comes with every packet, but does it just one time to be elegant and not keep overwriting the EEG_sensor_information variable   
    
    # here some arbitrary logic is implemented as an example: after 5 distraction alerts 
    # within 1 minute, a WhatsApp notification message is dispatched
    
    thanks to Neurospeed, the implementation of distraction reminted is  just few lines of code. 
       
     '''  
         
    global EEG_sensor_information    
    global distraction_count
    global first_disctraction_time
    if EEG_sensor_information == None:
        EEG_sensor_information = {}
        EEG_sensor_information["EEG_channel_names"] = payload["sensor_info"]["channel_map"]
        EEG_sensor_information["EEG_channel_num"] = len(payload["sensor_info"]["channel_map"])    
        EEG_sensor_information["sampling_frequency"] = payload["sensor_info"]["sampling_frequency"]

   #print(payload["output"])             
    data = payload["output"]['cognitive_analysis']['soft_decision']
   
    # print("soft decision: ", data)
    last_time_message_sent = time.time() - 20
    focus_threshold = 1.8
    distraction_count_threshold = 10
    max_message_rate = 20
    
    
    if data < focus_threshold: 
        print("defocus recognized")
        if distraction_count==0:
            first_disctraction_time = time.time()
        distraction_count +=1
    
    print("distraction count: ", distraction_count)
    
    # if enough distraction events recognized within last minute, and it's been enough time since last notification message, send a notificatino message:
    if distraction_count >= distraction_count_threshold:
        print("distraction count threshold reached!")
        if time.time() - last_time_message_sent > max_message_rate:
            last_time_message_sent = time.time()
            distraction_count = 0
            send_whatsapp("please pay attention!")
            print("please pay attention!")

    
        
    # if not nough distraction event recognized during last munute, reset the disctraction counter:
    if time.time() - first_disctraction_time > 60:
        distraction_count = 0
        
    
    

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
    global is_tab_open
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
    
    
    # time.sleep(60)
    # print("closing tab")
    # whatsapp.close_tab()
    # is_tab_open = False
    
  
if __name__ == '__main__':    
    main()  