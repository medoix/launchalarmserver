#### ACCOUNT API ####
# Register new account
Prefix: /v1/account/signup
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  id
  email
  pw
Output:
{
  "id": "medoix",
  "email": "medoix@gmail.com",
  "msg": "Check email for confirmation code"
}

# Confirm new account
Prefix: /v1/account/signup/confirm
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  id
  confirmCode
Output:
{
  "id": "medoix",
  "email": "medoix@gmail.com",
  "msg": "Account has been confirmed"
}

# Login to account
Prefix: /v1/account/login
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  id
  pw
Output:
{
  "jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZWRvaXgiLCJpYXQiOjE0NjI0ODI3NzkyNjQsImV4cCI6MTQ2MjU2OTE3OTI2NH0.pqxNWiWA1-bYkXZj_PtY_494mPIXTa372yJWzV4cHtU"
}

# Update account password
Prefix: /v1/account/password
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  id
  pw
  newPw
Output:
Created

# List account roles
Prefix: /v1/account/roles
Type: GET -> Headers
Arguments:
  authentication (put JWT key)
Output:
{
  "roles": []
}

# Update account roles
Prefix: /v1/account/roles
Type: POST -> Headers
Arguments:
  authentication : jwt token
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  authentication (put JWT key)
  deltas.role : (replace role with actual role) and can pass add / remove
  deltas.removeAll : true
Output:
{
  "roles": [
    "admin"
  ]
}

# Retrieve account details
Prefix: /v1/account/user
Type -> GET -> Headers
Arguments:
  authentication : jwt token
Output:
{
  "user": {}
}

# Update account details
Prefix: /v1/account/user
Arguments:
  authentication : jwt token
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  user.field : value (change field for whatever you like)
Output:
{
  "user": {
    "name": "Steven Rogers",
    "device": "1234567890"
  }
}

# List payment card details
Prefix: /v1/account/payments/cards
Type -> GET -> Headers
Arguments:
  authentication : jwt token
Output:
{
  "cards": [],
  "defaultCard": null
}

# Make payment using card details
Prefix: /v1/account/payments
Arguments:
  authentication : jwt token
Type: POST -> Body -> x-www-form-urlencoded
Arguments:
  charge.amount : 0
  charge.currency: usd
