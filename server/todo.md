# TODO
- DONE - Change account status from completed back to pending when app testing done.
- DONE - Have a look at weather we should be using email instead of id to login.
  - If so above, then we should remove email from the login return message.
  - DONE - Ensure all unit tests pass after the removal of ID as a required field.
- Updated response provided by /v1/account/password success (currently looks like there is no body returned like other endpoints).
- Complete API doco for - # Make payment using card details
- DONE - Compare diff provided for sign-up bug
- DONE - Compare diff the latest version uploaded to codecanyon - database changes etc.
- Validate launchalarm.com with Mailjet


# TODO LATER
- Enable expiry check if needed later and because tokens still have a 24 hour expiry window i can remote expire them by setting a date to check on this server.
  File = app/token.js
  Line = 101-105
