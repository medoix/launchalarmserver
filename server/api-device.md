#### DEVICE API ####
# Create device
Prefix: /v1/device/deviceCreate
Arguments:
  authentication : jwt token
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  type: device type, ios / android etc
  deviceId : device_token
Output:
{
  "devId": "1234567890",
  "msg": "Device Registered"
}

# Remove device
Prefix: /v1/device/deviceRemove
Arguments:
  authentication : jwt token
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  type: device type, ios / android etc
  deviceId : device_token
Output:
{
  "devId": "1234567890",
  "msg": "Device Removed"
}

# Get list of all devices registered
Prefix: /v1/device/devices
Type: GET
Output:
{
  "devicelist": [
    {
      "type": "android",
      "devId": "0987654321"
    },
    {
      "type": "ios",
      "devId": "1234567890"
    }
  ]
}
