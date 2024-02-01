![plantopticon2_large_no_shadow 9a4acea00bd4a90a9da6](https://github.com/dantheand/plants/assets/16441200/b75e7d6c-a066-4d4b-af6e-58211b3c4251)

# PLANTOPTICON

A plant tracking app meant to make it easy to track your plants' growth and lineages.

- `backend` is the FastAPI backend (Python)
- `plant-app` is the React frontend (Typescript)

## Development environment setup
### Dependencies
- Python 3.9+
- Node v20.10.0

### AWS stuff
- aws CLI
- aws credentials set up (use a profile)

## Services used
The AWS infrastructure is currently an artisinal, hand-crafted set of services. In the future, I will make it reproducible with some sort of IaC approach. 

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

<img width="409" alt="image" src="https://github.com/dantheand/plants/assets/16441200/d2a5a293-1e19-427d-ac2b-73652ad85382">

### Plant List

<img width="554" alt="image" src="https://github.com/dantheand/plants/assets/16441200/e7693f4b-e8b4-427b-8e3a-e459608e2052">


### Plant Grid View
<img width="554" alt="image" src="https://github.com/dantheand/plants/assets/16441200/74d0121b-64a6-44be-a6b8-186514403fc2">

### Create New Plants
<img width="554" alt="image" src="https://github.com/dantheand/plants/assets/16441200/b21ac886-f306-4121-a70b-a0615349b2cb">

### Edit Existing Plants
<img width="554" alt="image" src="https://github.com/dantheand/plants/assets/16441200/7484b06b-5833-4a20-b19a-a0ac25e06c23">

### Upload Images
<img width="554" alt="image" src="https://github.com/dantheand/plants/assets/16441200/d298c15a-6f8c-4302-90f8-06a4a22a451e">

### Timeline View of Plant Images
https://github.com/dantheand/plants/assets/16441200/55bba3f2-f8d4-4017-8ddf-87b1e8f72366

### Plant Lineage Visualizations
<img width="554" alt="image" src="https://github.com/dantheand/plants/assets/16441200/be2d0efb-b9bf-4717-991f-f6f7218a9049">


## Upcoming Feature ideas
In rough order of decreasing priority:
- Improving plant view
  - Filter by "current" or not (e.g. has the plant died or been given away)
- personal data export:
  - ability for users to export their plant data so they can analyze it or migrate it
- timelapse views
  - creating timelapse view of plant growth from photos
  - would be made easier by having a photo "ghost" overlay to previous photo when adding a new image
- plant event tracker
  - watering, fertilizing, repotting
- extracted features from images
  - machine vision to extract height, number of leaves, number of branches
  - species identification
- care recommendations (keyed to species)
- allow automated recognition of plant ID (increasing order of difficulty):
   - OCR of numbers written on tags
   - small QR codes
   - matching to previous photos of plant (way too hard)
