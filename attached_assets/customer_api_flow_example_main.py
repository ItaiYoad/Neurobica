# -*- coding: utf-8 -*-
"""
Created on Fri Sep 10 12:32:58 2021

@author: Eli Shamis
"""

import time
from pathlib import Path
import os

from neurospeed.auth.auth_as_customer_handler import Auth_AS_Customer_handler
from neurospeed.api_http_handlers.gateway_http_handler import Gateway_HttpHandler 
from neurospeed.api_http_handlers.ssr_http_handler import SSR_HttpHandler
from neurospeed.utils.helper_service import UtilService

from neurospeed.api_socket_handlers.customer_room_handler import CustomerRoom_Handler
from neurospeed.api_socket_handlers.user_room_as_customer_handler import UserRoom_AS_Customer_Handler
from neurospeed.api_socket_handlers.downlink_room_as_customer_handler import DownlinkRoom_AS_Customer_Handler

import hia_user_data_sender_example_main as Multiple_Users_HIA_Simulation


global customer_auth
userRooms_dict = {}


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

# you can add multiple functions into handler array in order to execute multiple callbacks as per your needs
generic_handler = { 
    'eeg': [ EEG_processing_handler1, EEG_processing_handler2 ],
    'gamepad': [customer_gamepad_msg_handler_function],
    'user_data': [customer_user_data_msg_handler_function]
}


def global_users_data_handler(userRoom_instance, payload):
    payload["username"] = userRoom_instance.get_username()
    
    username = payload["username"]
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
    
    
# listen on connected hia events, and connect to userRoom in order to monitor user data
def external_hia_device_connection_handler(event):
    global customer_auth
    global userRooms_dict

    username = event["username"]
    hia_id = event["hia_id"]
    sensors = event["sensors"]
    stream_ids = list(sensors.keys())
    print('external_hia_device_connection_handler event from User: {}, HIA: {} Stream_ids: {}'.format(username ,hia_id, stream_ids ))
    
    if username in userRooms_dict:
       # might be that user already connected with some other HIA device, 
       # so no need to create additional targetRoom for this user
       return
   
    userRoom = UserRoom_AS_Customer_Handler(customer_auth, username)
    # attach external generic handler, in order to propagate user data from "UserRoom_As_Customer_Handler" instance
    # this way every created user_room intance will propagate data to single function where you can apply your custom logic 
    userRoom.set_data_external_handler(global_users_data_handler) 
    userRoom.connect()
    # add created user room to a dict in order to manage and maintain  userRooms
    userRooms_dict[username] = userRoom
    
    
    # Example connect to user machine with SSR_Socket downlink. SSRsocket allows downlink between customer and user on any machine. 
    downlinkRoom = DownlinkRoom_AS_Customer_Handler(customer_auth, username)
    downlinkRoom.connect()
    time.sleep(3)
    if downlinkRoom.is_connected():
        message = "hello user {}".format(username) 
        downlinkRoom.route_message(message)
    
    
    # SSRhttp allows customer to send events to HIA clients (and only to HIA. Device must be connected as HIA)
    # Example of disable\enable stream via SSR HTTP module
    ssr_handler = SSR_HttpHandler(customer_auth)
    
    stream_ids = sensors.keys()
    time.sleep(3)
    # disable streams example
    for stream_id in stream_ids:
        ssr_handler.change_stream_state(username, hia_id, stream_id, "disabled")
        time.sleep(0.2)
    
    # Example SSR downlink that routes message to HIA as is.
    ssr_handler.send_downlink(username, hia_id, "message from SSR HTTP")
    time.sleep(10)    
    # enable streams 
    for stream_id in stream_ids:
        ssr_handler.change_stream_state(username, hia_id, stream_id, "enabled")
        time.sleep(0.2)
    
    
        

def external_hia_device_disconnect_handler(event):
    global customer_auth
    global userRooms_dict

    username = event["username"]
    hia_id = event["hia_id"]
    sensors = event["sensors"]
    stream_ids = list(sensors.keys())
    print('external_user_device_disconnect_handler event from User: {}, HIA: {} Stream_ids: {}'.format(username ,hia_id, stream_ids ))
    
    if username not in userRooms_dict:
        return

    # see readme (1)
    gateway_api = Gateway_HttpHandler(customer_auth)
    connected_users = gateway_api.get_connected_users()
    print("Connected_users: {}".format(connected_users))
    
    user_connected = False
    for connected_user in connected_users:
        connected_username = connected_user["username"]
        if connected_username == username:
            user_connected = True
            
    # if user doesnt exist in the list means he not connected and you can disconnect from his UserRoom
    if user_connected == False:
        userRoom = userRooms_dict[username]
        userRoom.disconnect()
        del userRooms_dict[username]
        

# Hint: you can set "Verbose_socket_log": "True" in customer config to enable more logging
def main():
    global customer_auth
    
    # load customer config file
    customer_config_path = os.path.join(str(Path().absolute()) ,"config","customer_config.json")
    customer_config = UtilService.load_config_file(customer_config_path)
    
    # Authenticate as customer
    customer_auth = Auth_AS_Customer_handler(customer_config)
    customer_auth.login()

    # connect to 'CustomerRoom_Handler', and listen on events across all users
    customerRoom = CustomerRoom_Handler(customer_auth)
    customerRoom.set_hia_connection_external_handler(external_hia_device_connection_handler)
    customerRoom.set_hia_disconnect_external_handler(external_hia_device_disconnect_handler)
    customerRoom.connect()
    
    # see readme (2)
    gateway_api = Gateway_HttpHandler(customer_auth)
    connected_users = gateway_api.get_connected_users()
    print('connected users list from HTTP API:', connected_users)


    # Multiple_Users_HIA_Simulation: 2 USERS, 1 HIA PER USER, 2 SENSORS PER HIA
    # see readme (3)
    # uncomment this in order to run hia example in current console. 
    # or run hia_user_data_sender_example_main.py in another console.
    #Multiple_Users_HIA_Simulation.run_HIAs() 

    

if __name__ == '__main__':    
    main()  