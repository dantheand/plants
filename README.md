![plant_logo_leaf_only_small](https://github.com/dantheand/plants/assets/16441200/a2ef5002-8abb-4f2c-81ba-9bb8575df8bd)
# Plant App


## Development environment setup
### Dependencies
- Python >=3.9
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
- Cloudwatch for logging output from FastAPI lambda

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
 

## plant
## Feature ideas
- DB-driven plant tracking
  - add/remove plants
  - fixed properties for each plant
    - species (another DB table)
    - name
  - care reccomendations (keyed to species)
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
  - default view of your own plants
  - ability to see other user's plants (for now)
- data access
  - initially just provide easy export to .csv
  - timeline view of plants
- data entry
  - allow automated recognition of plant ID (increasing order of difficulty):
     - small QR codes
     - OCR of numbers written on tags
     - matching to previous photos of plant (way too hard)
