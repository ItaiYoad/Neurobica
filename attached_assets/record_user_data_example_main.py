# -*- coding: utf-8 -*-
"""
Created on Tue Sep 14 13:42:26 2021

@author: Eli Shamis
"""

import time
from pathlib import Path
import os
from neurospeed.auth.auth_as_customer_handler import Auth_AS_Customer_handler
from neurospeed.api_http_handlers.recorder_http_handler import UserRoom_Recorder_Handler
from neurospeed.utils.helper_service import UtilService


global customer_auth
global recorder_handler
global username


def run_recorder_flow():
    global recorder_handler
    global username
    # create recorder. recorder created with status "resource_pending". once available recording resources found and assgined
    # recorder status will change to "pending", then once recorder picked by assigned recorder resources and start to record status will change to "recording"

    recorder = recorder_handler.create_recorder(username)
    recorder_id = str(recorder["id"])
    print('created recorder with id', recorder_id)
    
    recorder = recorder_handler.get_recorder(recorder_id)     
    print("recorder status: " + recorder["status"])
    
    recorder_recording = False
    max_query_attemps = 10
    query_attemps = 1
    while (recorder_recording != True & (query_attemps < max_query_attemps) ):
        recorder = recorder_handler.get_recorder(recorder_id)   
        print("recorder status: " + recorder["status"])
        if (recorder["status"] == "recording"):
            print('recorder started recording')
            recorder_recording = True
        else:
            print('recorder not recording yet')
            query_attemps = query_attemps + 1
            time.sleep(3)
             
    if (recorder_recording != True):
        print('recorder not yet recording after ' + str(query_attemps)  + ' query attempts')
        recorder_handler.delete_recorder(recorder_id)
        return
    
    
    print('~~~~~~~~~~~~~~~~~~')
    time.sleep(5)

    #once recorder starts recording, you can change it's status to paused or stopped. you can resume paused recorder but not stopped recorder
    # pause recorder:
    res = recorder_handler.update_recorder(recorder_id, "paused")
    recorder = recorder_handler.get_recorder(recorder_id)     
    print("recorder status: " + recorder["status"])
    time.sleep(5)
    
    # reactivate paused recorder
    recorder_handler.update_recorder(recorder_id, "pending") 
    recorder = recorder_handler.get_recorder(recorder_id)     
    print("recorder status: " + recorder["status"])
    
    time.sleep(5)
    
    #recorder_handler.delete_recorder(recorder_id) # uncomment this to delete recorder
    recorders = recorder_handler.list_recorders(username)
    print(recorders)
    
    return recorder_id

    
    
def main():
    global customer_auth
    global recorder_handler
    global exporter_handler
    global username

    # load Customer configuration
    customer_config_path = os.path.join(str(Path().absolute()) ,"neurospeed\\config","customer_config.json")
    customer_config = UtilService.load_config_file(customer_config_path)
    
    # Authenticate as customer
    customer_auth = Auth_AS_Customer_handler(customer_config)
    customer_auth.login()
    
    os.path.join(str(Path().absolute()) ,"neurospeed\\config","hia_config1.json")
    config_user1 = UtilService.load_config_file(os.path.join(str(Path().absolute()) ,"neurospeed\\config","hia_config1.json"))
    username = config_user1["username"] # or set here another custom username

    recorder_handler = UserRoom_Recorder_Handler(customer_auth)
    recorder_id = run_recorder_flow()
    print('RECORDER ID: {}'.format(recorder_id))



if __name__ == '__main__':    
    main()  