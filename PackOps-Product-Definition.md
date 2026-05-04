# PackOps — Full App Definition

## 1. Product overview

**PackOps** is a collaborative rescue-dog care and training platform.

It is designed for **one dog being managed by multiple humans**, while keeping ownership and accountability clear:
- each dog has exactly **one main human**
- each dog can also have multiple **approved humans**
- a single human can be the **main human for multiple dogs**
- approved humans can help manage routine care, training, medical records, device connections, and daily operations

PackOps is not just a pet tracker. It is an **operational system for dogs and the people responsible for them**.

It combines:
- daily routine tracking
- structured training management
- medical/shots tracking
- collar QR identity
- multi-human collaboration
- tracker/device integrations

---

## 2. Core product purpose

PackOps should help answer these questions quickly:

- What does the dog need right now?
- What happened today?
- Who is responsible for this dog?
- What care, medical, or training actions are due?
- What did the last training session look like?
- Where is the dog?
- If the dog is found, how can someone identify and return it?

---

## 3. Main relationship model

### Dog
A dog is the central entity in the platform.

Each dog has:
- one profile
- one main human
- multiple approved humans
- routine logs
- training sessions
- medical records
- device connections
- collar QR identity

### Human
A human is a user of the app.

A human can:
- create dogs
- be the main human for multiple dogs
- be an approved human on multiple dogs
- log and manage data for dogs they are approved on

### Main human
Each dog must have exactly **one main human**.

A main human can:
- approve or reject humans who request access to that dog
- revoke access for humans on that dog
- manage QR public visibility for that dog
- do everything an approved human can do

A main human **can have more than one dog**.

### Approved humans
Each dog can have multiple approved humans.

Approved humans can do all approved-human tasks for that dog.

#### Approved-human sub-roles
These are labels, not restrictive permission layers:
- caregiver
- trainer
- walker
- foster

All sub-roles can do everything an approved human can do.

That means any approved human can:
- log routine events
- create and edit training sessions
- add trainer insights
- add and edit medical records
- link devices
- scan a dog QR and access the full dog record if approved
- upload media and documents

Only the main human can:
- approve/reject new humans
- revoke humans
- manage ownership-level settings
- manage public QR visibility

---

## 4. Authentication and onboarding

### Human sign up / sign in
Humans create normal accounts and authenticate into PackOps.

After signing in, a human can:
- create a new dog
- join an existing dog
- search for a dog by the main human’s email
- search for a dog by the main human’s phone
- scan a collar QR
- request access to a dog

### Dog registration
The app supports dog registration, which means creating a dog profile.

Dog registration includes:
- dog name
- dog photo
- breed / mix
- age
- sex
- weight
- chip ID
- behavior notes
- rescue organization
- emergency contact
- address / home base
- main human assignment
- optional device linking
- optional QR generation

### Join an existing dog
A user can add or join a dog by:
- searching the main human’s email
- searching the main human’s phone
- scanning the collar QR
- accepting an invite in future versions

#### Join flow
1. user chooses “Join existing dog”
2. searches by email or phone
3. sees safe preview results
4. selects the dog
5. sends request
6. main human approves or rejects

#### Safe preview before approval
Before approval, the user should only see:
- dog photo
- dog name
- main human name
- rescue organization if available

No sensitive internal data should be shown before approval.

---

## 5. Main screens

### A. Home / Dashboard
This is the operational center of PackOps.

It should show:

#### Dog summary card
- dog photo
- dog name
- current status
- main human
- connected tracker status
- battery level
- last seen / location summary

#### Quick routine actions
One-tap logs for:
- slept
- ate
- drank
- peed
- pooped
- had a walk

Each quick log stores:
- timestamp
- who logged it
- optional note
- source: manual or device/imported

#### Today timeline
A chronological feed of:
- routine logs
- medical updates
- training sessions
- device alerts
- human approvals

#### Needs attention
Examples:
- walk overdue
- no water logged recently
- vaccine due
- medication due
- tracker battery low
- tracker disconnected
- pending access request
- upcoming training

#### Training snapshot
- next training session
- last completed training
- most recent trainer insight
- progress highlight

#### Medical snapshot
- next shot due
- active medication
- latest vet visit

#### Human activity snapshot
- recent logs by humans
- pending approval requests

### B. Training page
This is a major differentiator of PackOps.

The training page should support:
- create training session
- edit session
- browse history
- filter sessions
- attach media
- add trainer insights
- track required device usage
- use templates and copy-previous-session behavior

Each training session includes:
- dog
- training type
- trainer
- handler
- date/time
- duration planned
- duration actual
- location
- objective
- setup
- environment
- distractions
- equipment
- success criteria
- result
- free notes
- trainer insights
- media
- tracker required yes/no
- tracker connected yes/no

### C. Medical page
The medical area tracks health, shots, and treatment history.

It should support:
- vaccinations / shots
- medications
- flea/tick treatments
- deworming
- allergies
- diagnoses
- surgeries
- vet visits
- medical documents
- due dates
- reminders

#### Medical sections
- shots
- medications
- vet visits
- alerts / upcoming due items
- documents

Each medical record includes:
- category
- title
- date
- next due date
- provider / vet / clinic
- notes
- attachment
- created by

### D. Humans page
Shows all humans attached to a dog.

It should include:
- main human
- approved humans
- each human’s sub-role
- pending requests
- approve/reject actions for main human
- revoke access for main human

### E. Devices page
Shows device and tracker connections for a dog.

It should include:
- connected trackers/devices
- who linked each device
- sync status
- battery
- last sync
- unlink/remove device
- basic device activity summary

Important rule:
**all approved humans can link a device**.

### F. Dog ID / QR page
This page manages the collar QR identity.

It should support:
- create QR
- regenerate QR
- preview public dog ID card
- print/download collar tag
- share dog card
- scan QR

---

## 6. Routine tracking

PackOps should support daily tracking for:
- sleep
- eating
- drinking
- pee
- poop
- walk

Each routine event should support:
- timestamp
- who logged it
- manual vs device source
- optional notes

Optional details:
- food type
- food amount
- water amount
- walk duration
- walk distance
- stool notes
- urine notes
- sleep duration

History views:
- today
- weekly
- date-based filtering

---

## 7. Training system

### Supported training types

Initial required set:
- treadmill
- search
- smelling / scent discrimination
- bark / alert
- bite

Additional training types:
- tracking / trailing
- area search
- recall under distraction
- heel / focused obedience
- place / stay / settle
- agility / confidence course
- retrieve / object carry
- crate / kennel conditioning
- social neutrality / exposure
- noise desensitization
- impulse control / leave-it
- cooperative care / handling

### Training fields

Every training should include:
- objective
- setup
- environment
- distractions
- equipment
- success criteria
- result
- free notes
- trainer insights

### Training template behavior

This is an official PackOps feature.

For each **dog + training type**, after the **first session** of that type is created, the app should create a reusable default template.

That means future sessions of the same type for the same dog should be **automatically pre-filled**.

#### Auto-filled behavior
Future sessions should pre-fill:
- objective
- setup
- environment
- distractions
- equipment
- success criteria
- result
- free notes
- trainer insights

All pre-filled fields must remain editable.

#### Required template features
For each dog + training type, PackOps should support:
- auto-create default template after first session
- auto-fill future sessions
- update template from a session
- reset template to blank
- reset template to system default
- copy previous session instead of using template

#### Training form behavior
When creating a session:
1. choose dog
2. choose training type
3. app checks for template
4. if template exists, form is pre-filled
5. user can edit all fields
6. user can choose:
   - use saved template
   - copy previous session
   - update template on save
   - reset template

---

## 8. Tracker and device integration

PackOps should connect to major dog tracker providers.

The device layer is used for:
- live/last known location
- route history
- activity
- sleep
- behavior signals
- training validation where tracking is required

Important rule:
**all approved humans can link a tracker/device**.

### Tracker rules by activity

#### Tracker required
These activities should require a tracker:
- search
- tracking / trailing
- area search
- certain outdoor or off-leash activities

#### Tracker recommended
These activities should strongly recommend a tracker:
- treadmill
- agility
- bark training
- social exposure
- long walks

#### Manual fallback
Manual logging should still be allowed where a tracker is not mandatory.

---

## 9. Collar QR identity

This is a signature PackOps feature.

Each dog should have a QR code that can be placed on the collar.

### Public scan behavior
When any PackOps user scans the collar QR, the app opens a **public-safe dog ID card**.

This public-safe card should show:
- dog name
- dog photo
- owner/main human
- phone
- address
- emergency contact
- rescue organization
- medical alerts
- return instructions

### Approved-human scan behavior
If the scanner is an approved human for that dog, the scan should open the **full dog profile**.

That includes:
- routine logs
- training sessions
- medical records
- device data
- internal notes

### Main-human scan behavior
Main human sees the full dog profile plus management actions.

### Public visibility control
The main human should be able to configure which public fields are visible, for example:
- address on/off
- phone on/off
- rescue org on/off
- medical alerts on/off

---

## 10. Permissions summary

### Main human
Can:
- approve/reject humans
- revoke humans
- manage public QR visibility
- manage ownership-level settings
- do everything an approved human can do

### Approved human
Can:
- log routine events
- create/edit training sessions
- add trainer insights
- add/edit medical records
- link devices
- scan QR and access full dog profile if approved
- upload media/documents

Cannot:
- approve/reject humans
- revoke humans
- control ownership-level settings

---

## 11. Alerts and reminders

PackOps should generate operational reminders such as:
- vaccine due
- medication due
- walk overdue
- no recent food/water log
- pending approval request
- upcoming training session
- tracker battery low
- tracker disconnected

---

## 12. Insights and reporting

PackOps should provide summary insights over time.

Examples:
- walked less than usual this week
- no water logged recently
- barking increased
- sleep dropped
- training consistency improved
- search performance improved
- medical action due soon

Suggested views:
- daily summary
- weekly summary
- training progress highlights
- medical due summary
- recent trainer insights
- device activity summary

---

## 13. Media and documents

PackOps should support uploads for:
- training photos/videos
- vet records
- vaccination proof
- medical documents
- notes and files attached to sessions or records

---

## 14. Navigation structure

A clean PackOps navigation would be:

- **Home**
- **Training**
- **Medical**
- **Dog ID / QR**
- **Humans**
- **Devices**
- **Profile / Settings**

If multi-dog support is present from the beginning, there should also be:
- a **dog switcher**
- optionally a **My Dogs** page

---

## 15. Multi-dog support

This is part of the PackOps definition.

A single human can:
- be main human for multiple dogs
- be approved human on multiple other dogs

Each dog still has:
- exactly one main human
- its own humans, devices, logs, medical records, training history, and QR identity

This means PackOps should support:
- multiple dog profiles under one human account
- switching between dogs
- separate management per dog
- separate device and medical history per dog

---

## 16. One-line product definition

**PackOps is a collaborative rescue-dog care and training app that lets multiple approved humans manage one dog’s routine, medical records, training sessions, device data, and collar QR identity, while allowing one main human to oversee access and ownership.**

---

## 17. Strongest differentiators

What makes PackOps distinct:
- multi-human collaboration around one dog
- one-main-human approval model
- main human can manage multiple dogs
- collar QR with public-safe and private views
- structured training workflows
- per-dog per-training-type templates
- medical/shots tracking
- device-backed activity and GPS support

---

## 18. Recommended MVP

The most focused first version of PackOps should include:
- human authentication
- create dog
- multi-dog support for one human
- join dog by email/phone search
- approval flow
- main dashboard
- routine logging
- training sessions
- training templates
- medical care
- QR collar identity
- device linking
- basic alerts

---

## 19. Product identity

Final name:
# **PackOps**

Brand direction:
- professional
- operational
- trustworthy
- modern
- built for real coordination, not just casual pet journaling
