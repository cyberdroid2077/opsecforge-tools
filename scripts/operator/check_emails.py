import imaplib
import email
import os
import sys

# Read password from secure file
PASS_FILE = "/home/dingw/.zoho_pass"
try:
    with open(PASS_FILE, "r") as f:
        PASSWORD = f.read().strip()
except FileNotFoundError:
    print(f"Password file {PASS_FILE} not found. Cannot check emails.")
    sys.exit(1)
    
if not PASSWORD:
    print("Password is empty. Cannot check emails.")
    sys.exit(1)

def get_emails():
    try:
        mail = imaplib.IMAP4_SSL('imap.zoho.com')
        mail.login('admin@opsecforge.com', PASSWORD)
        mail.select('inbox')

        _, search_data = mail.search(None, 'UNSEEN')
        
        email_ids = search_data[0].split()
        
        if not email_ids:
            print("No new emails.")
            return

        print(f"Found {len(email_ids)} unread emails.")

        for e_id in email_ids:
            _, data = mail.fetch(e_id, '(RFC822)')
            msg = email.message_from_bytes(data[0][1])
            
            subject = msg.get('Subject', '(No Subject)')
            sender = msg.get('From', '(No Sender)')
            
            print(f"---")
            print(f"From: {sender}")
            print(f"Subject: {subject}")
            
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode()
                        break
            else:
                body = msg.get_payload(decode=True).decode()
                
            print(f"Body:\n{body.strip()}")
            print(f"---")

    except Exception as e:
        print(f"Error checking emails: {e}")

if __name__ == '__main__':
    get_emails()
