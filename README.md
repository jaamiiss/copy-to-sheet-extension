### Copy to Sheet Chrome Extension
Copy text from any website and quickly save it to your Google Sheet.

This Chrome Extension lets you:

✅ Select text and save it as a title or a message using a right-click context menu
✅ View and edit the captured text in a floating draggable panel
✅ Submit your text to a linked Google Sheet (via Google Apps Script)
✅ Get instant confirmation with a panel message and Chrome notifications

### 🚀 Features
Save selected text as title or message from the context menu

Show a floating panel with saved content

Easily submit saved text to a Google Sheet

Confirmation messages and toasts

Draggable modern UI panel

Hover effects on buttons

Works across any website

### ⚙️ Installation
Clone or download this repository to your machine

Open Chrome and go to chrome://extensions

Enable Developer mode

Click Load unpacked and select this folder

Done!

### 📝 Google Sheet Setup
Create a new Google Sheet

Publish an Apps Script Web App:

In the Sheet, open Extensions > Apps Script

Add the doPost(e) function to receive data (provided in this repo)

Deploy it as a Web App with Anyone access

Copy the Web App URL and set it as ```WEBAPP_URL``` in ```background.js```

Example Apps Script:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID").getSheetByName("Sheet1");
  const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      data.title || "",
      data.message || ""
    ]);

    return ContentService
      .createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService
      .createTextOutput("Error: " + err)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
```

### 🖥️ How to Use
✅ Highlight any text on a web page
✅ Right-click → Save as Title or Save as Message
✅ Use Send Title + Message to Sheet from the context menu, or open the Floating Panel
✅ From the floating panel, press Submit to send the data
✅ See confirmation message directly in the panel

### 🪄 Technologies
JavaScript (Vanilla)

Chrome Extension Manifest V3

Google Apps Script

Google Sheets

### 🎨 Screenshots


### 🛠️ Development
Open ```background.js``` and set your ```WEBAPP_URL```

Tweak ```content.js``` styles for your desired panel look

Reload the extension in chrome://extensions on each change

📄 License
This project is free to use and modify. Attribution appreciated.
