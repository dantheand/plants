![plant_logo_leaf_only_small](https://github.com/dantheand/plants/assets/16441200/a2ef5002-8abb-4f2c-81ba-9bb8575df8bd)
# Plant App

A plant tracking app meant to make it easy to track plant growth and lineages.

- `backend` is the FastAPI backend (Python)
- `plant-app` is the React frontend (Typescript)

## Development environment setup
### Dependencies
- Python 3.9
- node 18?

### AWS stuff
- aws CLI
- aws credentials set up (use a profile)

## Services used
### AWS 
- AWS Amplify for front-end builds and deployment
- AWS Lambda function hosts and runs FastAPI through `Mangum` handler
- API Gateway in "proxy" mode triggers lambda function
- DynamoDB NoSQL DB for basic single-table DB
  - Created global secondary index 'SK-PK-index' to allow querying by plant_id directly 
- S3 for image hosting
- IAM for role and permissions management for each of the above services
- Cloudwatch for logging outputs

### Google
- Oauth authentication tokens
  
## Running/Deploying the App

### Local
Start FastAPI backend and react frontend using scripts in `/scratch/scripts.sh`

### Production (on the internet)
On pushes to `master`:

#### Frontend
- AWS Amplify pointed at this GitHub repository does automated builds and deployment

#### Backend
- Github actions package and deploy FastAPI backend to lambda

## Screenshots

### Google SSO
<img width="1178" alt="image" src="https://github.com/dantheand/plants/assets/16441200/0be0a861-7d87-4ba3-81f7-452753dc1608">

### Plant List
<img width="1178" alt="image" src="https://github.com/dantheand/plants/assets/16441200/866ca19b-d628-443a-9e0f-6578e4bb420a">

### Create New Plants
<img width="1178" alt="image" src="https://github.com/dantheand/plants/assets/16441200/6b0af217-2f15-4925-b411-e8fc84055852">

### Edit Existing Plants
<img width="1178" alt="image" src="https://github.com/dantheand/plants/assets/16441200/11c49463-2f22-408e-b2d7-8fca5f19ad79">

### Upload Images
<img width="1178" alt="image" src="https://github.com/dantheand/plants/assets/16441200/83b4bad2-806d-46db-9ba3-64f82c153ef4">

### Timeline View of Images
https://github.com/dantheand/plants/assets/16441200/4888f693-cb10-490a-9b87-25aa4097205f



## Feature ideas
- DB-driven plant tracking
  - add/remove plants
  - fixed properties for each plant
    - species
    - name
    - ...
  - care recommendations (keyed to species)
  - timeline of properties for each plant
    - height, number of leaves, number of branches
  - plant lineage tracking (plant parent/children)
  - plant event tracker
    - watering, fertilizing, repotting
- photo taking and sorting
  - photos over time attached to plants
  - photo "ghost" overlay to previous photo to help make timelapses
- interface:
  - sort by plants
  - look at photos
- viewing users plants:
  - filter by "current" plants (haven't sunk anywhere)
  - default view of your own plants
  - ability to see other user's plants (for now)
- general data access
  - initially just provide easy export to .csv
  - timeline view of plants
- data entry
  - allow automated recognition of plant ID (increasing order of difficulty):
     - plant ID number ML
     - small QR codes
     - OCR of numbers written on tags
     - matching to previous photos of plant (way too hard)
