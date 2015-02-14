""" When a user signs up, we send them an email. They respond to this email with their resume as an attachment so that our
client is as thin as possible and mobile/desktop agnostic. We don't want to extract each of these resumes manually, so
we can run this script in the background to pull the pdf from each incoming email. This is based on a stackoverflow answer.

TODO: is extracting pdfs from arbitrary emails a security threat? probably.
"""


import sys
import imaplib
import smtplib
import getpass
import email
import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.message import MIMEMessage

M = imaplib.IMAP4_SSL('imap.gmail.com')

try:
    M.login('ACCOUNT INFO')
except imaplib.IMAP4.error:
    print "LOGIN FAILED!!! "
    # ... exit or deal with failure...

# reply to each email with a congratulatory message. Maybe easier to do with sendgrid integration?
def successReply(msg) :
	new = MIMEMultipart("mixed")
	body = MIMEMultipart("alternative")
	body.attach( MIMEText("We recieved your resume!", "plain") )
	#body.attach( MIMEText("<html>reply body text</html>", "html") )
	new.attach(body)
	new["Message-ID"] = email.utils.make_msgid()
	new["In-Reply-To"] = msg["Message-ID"]
	new["References"] = msg["Message-ID"]
	new["Subject"] = "Re: "+msg["Subject"]
	new["To"] = msg["Reply-To"] or msg["From"]
	new["From"] = "hackerships@gmail.com"
	new.attach( MIMEMessage(msg) )
	server = smtplib.SMTP('smtp.gmail.com',587) #port 465 or 587
	server.ehlo()
	server.starttls()
	server.ehlo()
	server.login('ACCOUNT INFO')
	server.sendmail('hackerships@gmail.com','davidcalvermace@gmail.com',new.as_string()) #TODO: I need to change this to user's email after done testing
	server.close()

	#TODO don't respond to messages that we've already seen the id of:   msg["Message-ID"]

# if there is something other than a PDF attached, reply asking for a PDF.
def requestPdf(msg) :
	new = MIMEMultipart("mixed")
	body = MIMEMultipart("alternative")
	body.attach( MIMEText("Please send your resume in PDF format.", "plain") )
	#body.attach( MIMEText("<html>reply body text</html>", "html") )
	new.attach(body)
	new["Message-ID"] = email.utils.make_msgid()
	new["In-Reply-To"] = msg["Message-ID"]
	new["References"] = msg["Message-ID"]
	new["Subject"] = "Re: "+msg["Subject"]
	new["To"] = msg["Reply-To"] or msg["From"]
	new["From"] = "hackerships@gmail.com"
	new.attach( MIMEMessage(msg) )
	server = smtplib.SMTP('smtp.gmail.com',587) #port 465 or 587
	server.ehlo()
	server.starttls()
	server.ehlo()
	server.login('ACCOUNT INFO')
	server.sendmail('hackerships@gmail.com','davidcalvermace@gmail.com',new.as_string())
	server.close()


# look through our mailbox and pick up all emails that we haven't seen that have pdfs attached
def process_mailbox(M):
  rv, data = M.search(None, "ALL")
  if rv != 'OK':
      print "No messages found!"
      return

  for num in data[0].split():
      rv, data = M.fetch(num, '(RFC822)')
      if rv != 'OK':
          print "ERROR getting message", num
          continue

      msg = email.message_from_string(data[0][1])
      if msg['Subject']!='Re: Resume Drop' :
          continue
      address=msg['From'] #TODO THIS WONT WORK IF THE EMAIL IS AUTO FORWARDED!!!
      address=email.utils.parseaddr(address)[1]
      attachment = msg.get_payload()[1]

      if attachment.get_content_type()!='application/pdf' :
      	requestPdf(msg)
      	continue

      # write pdf to our local directory
      open('resumes/'+address+'.pdf', 'wb').write(attachment.get_payload(decode=True))

      #reply as confirmation
      successReply(msg)

      #print 'Raw Date:', msg['Date']
      #date_tuple = email.utils.parsedate_tz(msg['Date'])
      #if date_tuple:
      #    local_date = datetime.datetime.fromtimestamp(
      #        email.utils.mktime_tz(date_tuple))
      #    print "Local Date:", \
      #        local_date.strftime("%a, %d %b %Y %H:%M:%S")

rv, data = M.select("Inbox")
if rv == 'OK':
    print "Processing mailbox...\n"
    process_mailbox(M) # ... do something with emails, see below ...
    M.close()
M.logout()