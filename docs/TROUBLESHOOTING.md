# Troubleshooting

## Loader never stops
- Ensure the Webhook node is configured to respond only after the final node completes, or use a Respond to Webhook node.
- Final response must include JSON body. Recommended:
  ```json
  { "reply": [ { "Folder_url": "https://..." } ] }
  ```
- Add `Content-Type: application/json` header.

## You see "Response: {}"
- Your endpoint returned an empty object. Check the Respond to Webhook node output and expressions.

## CORS errors
- Add `Access-Control-Allow-Origin: *` to the Respond to Webhook headers when testing.

## Enter key inserts newline instead of sending
- In chat shell, Enter sends; Shift+Enter adds a newline. If it doesn’t, ensure focus is on the textarea.

## Different JSON shape
- The UI will show any JSON it doesn’t recognize; to integrate properly, map your keys to `reply[0].Folder_url` and optional `Company_name`.
