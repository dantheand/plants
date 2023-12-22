
![DALL·E 2023-12-19 00 28 16 - A minimalist logo for a plant growth tracking app  The logo should include a stylized depiction of a growing plant, symbolizing growth and progression](https://github.com/dantheand/plants/assets/16441200/000dde1f-9b1d-4d54-b54f-e655b0466c6e)

# Development environment setup
### Dependencies
- Python >=3.9
- node 18?

### AWS stuff
- aws CLI
- aws credentials set up (use a profile)

# Services used
## AWS 
- AWS Amplify for front-end builds and deployment
- AWS Lambda function hosts and runs FastAPI through `Mangum` handler
- API Gateway in "proxy" mode triggers lambda function
- DynamoDB NoSQL DB for basic single-table DB
- S3 for image hosting
- IAM for role and permissions management for each of the above services
- Cloudwatch for logging output from FastAPI lambda

## Google
- Oauth authentication tokens
  
# Running/Deploying the App

## Local
Start FastAPI backend and react frontend using scripts in `/scratch/scripts.sh`

## Production (on the internet)

### Frontend
- AWS Amplify pointed at this GitHub repository does automated builds and deployment everytime `master` branch changes

### Backend
- use scripts in `/scratch/scripts.sh` to package up FastAPI backend and its dependencies into a .zip file
- then update the lambda function
 

# plant
## Possible features
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
- data access
  - initially just provide easy export to .csv
  - timeline view of plants
- data entry
  - allow automated recognition of plant ID (increasing order of difficulty):
     - small QR codes
     - OCR of numbers written on tags
     - matching to previous photos of plant (way too hard)
