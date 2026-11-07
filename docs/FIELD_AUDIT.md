# CareCircle ↔ Meridian field coverage audit

Generated from live OpenAPI `/api/ext/v1/openapi` and create-validation probes.
Platform Issue (`platform_issue`) is excluded from the product UI.

## Legend
- **FE list/detail/create/edit**: frontend surface coverage after this change set
- **Biz ID**: auto-generated UUID-style business ID — never sent on create
- Meridian OpenAPI marks most fields `required: false`; runtime validation is authoritative

## Patient (12)

| API ID | Label | Notes | FE |
|--------|-------|-------|----|
| patientId | Patient ID | Auto UUID biz id | detail |
| firstName | First Name | | create/edit/detail |
| middleName | Middle Name | | detail (optional edit) |
| lastName | Last Name | | create/edit/detail |
| preferredName | Preferred Name | | create/edit/detail |
| dateOfBirth | Date of Birth | date | detail |
| preferredLanguage | Preferred Language | | create/edit |
| careStatus | Care Status | | create/edit/detail |
| emailAddress | Email Address | | create/edit/detail |
| phoneNumber | Phone Number | | create/edit/detail |
| careStartDate | Care Start Date | date | create/detail |
| portalAccessStatus | Portal Access Status | Not Invited/Invited/Linked/Revoked | onboard |

## Caregiver (11)

| API ID | Label | FE |
|--------|-------|----|
| caregiverId | Caregiver ID | detail |
| firstName / middleName / lastName / preferredName | Name | onboard/list |
| caregiverType | Caregiver Type | list/filter coordinators |
| emailAddress / phoneNumber | Contact | list/detail |
| preferredLanguage | Language | onboard |
| status | Status | list (Active filter) |
| portalAccessStatus | Portal Access | onboard Linked |

## Care Circle Membership (7)

| API ID | Label | Runtime enum | FE |
|--------|-------|--------------|----|
| membershipId | Membership ID | auto | list/detail |
| patient | Patient | lookup biz id | list |
| caregiver | Caregiver | lookup biz id | list |
| relationshipType | Relationship | Parent, Child, Spouse, Sibling, Family Member, Friend, Care Coordinator, Other | create/redeem |
| membershipStatus | Status | **Active, Inactive only** | list |
| startDate / endDate | Dates | | list |

## Care Plan (8)

| API ID | Label | Runtime required | FE |
|--------|-------|------------------|----|
| carePlanId | Care Plan ID | auto | list/detail |
| patient | Patient | **yes** | list/detail/create/edit |
| recoveryGoals | Recovery Goals | **yes** | all |
| dischargeDate | Discharge Date | no | create/edit/detail |
| assignedCoordinator | Assigned Coordinator | **yes** (Active Care Coordinator) | create/edit/detail |
| status | Status | **yes** | create/edit/detail |
| startDate | Start Date | **yes** | create/edit/detail |
| reviewDate | Review Date | no | create/edit/detail |

## Appointment (8)

Covered by existing appointments UI + authorized filtering.

## Medication (7)

| API ID | Label | Runtime required | FE |
|--------|-------|------------------|----|
| medicationId | Medication ID | auto | list/detail |
| patient | Patient | **yes** | all |
| medicationName | Medication Name | **yes** | all |
| instructions | Instructions | no | all |
| frequency | Frequency | no | all |
| refillDate | Refill Date | no | all |
| status | Status | **yes** | all |

## Care Task (10)

| API ID | Label | Runtime required | FE |
|--------|-------|------------------|----|
| taskId | Task ID | auto | list/detail |
| patient | Patient | **yes** | all |
| carePlan | Care Plan | **yes** | all |
| assignedCaregiver | Assigned Caregiver | **yes** + Active membership | all |
| description | Description | **yes** | all |
| dueDate | Due Date | **yes** | all |
| priority | Priority | **yes** | all |
| status | Status | **yes** (Pending/In Progress/Completed/Overdue) | all |
| completedOn | Completed On | set on complete | detail |
| escalated | Escalated | boolean | detail/edit |

## Notification (9)

List/filter authorized; create form exists separately.

## Empty-collection findings (live tenant at audit time)

| Object | Count before seed | Cause |
|--------|-------------------|-------|
| carePlan | 0 | No records (not API failure) |
| medication | 0 | No records |
| careTask | 0 | No records |
| careCircleMembership | >0 after prior link work | Filtered by account |

Seeded sample records for German U (`PAT-586e6d5b-…`) to verify list/detail UI: Care Plan, Medication, Care Tasks.
