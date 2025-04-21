# -*- coding: utf-8 -*-
"""
Created on Fri Sep 10 12:32:58 2021

@author: Eli Shamis
"""
from pathlib import Path
import os

from neurospeed.auth.auth_as_user_handler import Auth_AS_User_Handler
from neurospeed.api_socket_handlers.user_room_as_user_handler import UserRoom_AS_User_Handler
from neurospeed.utils.helper_service import UtilService

global user_auth



def EEG_processing_handler1(payload):
    # your implementation
    print('EEG_processing_handler1')
    pass;

def EEG_processing_handler2(payload):
    # your implementation
    print('EEG_processing_handler2')
    pass;
    
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
    print(username)
    stream_id = payload["stream_id"]
    device_type = payload["device_type"]
    hia_id = payload["hia_id"]
    sensor_info = payload["sensor_info"]
    print("data from user: {} hia: {} stream_id: {} device_type: {}".format(username, hia_id, stream_id, device_type))
    
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

    user1_config_path = os.path.join(str(Path().absolute()) ,"neurospeed\\config\\","hia_config1.json")
    print(user1_config_path)
    config_user1 = UtilService.load_config_file(user1_config_path)


    # Authenticate as user
    user_auth = Auth_AS_User_Handler(config_user1)
    user_auth.login()

    userRoom = UserRoom_AS_User_Handler(user_auth)
    userRoom.set_data_external_handler(user_data_external_handler)
    userRoom.set_device_events_external_handler(user_device_event_external_handler)

    userRoom.connect()
    


    

if __name__ == '__main__':    
    main()  