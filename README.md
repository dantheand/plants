
![DALL·E 2023-12-19 00 28 16 - A minimalist logo for a plant growth tracking app  The logo should include a stylized depiction of a growing plant, symbolizing growth and progression](https://github.com/dantheand/plants/assets/16441200/000dde1f-9b1d-4d54-b54f-e655b0466c6e)

## Development environment setup
### Dependencies
- Python >=3.9
- node 18?

### AWS stuff
- aws CLI
- aws credentials setup
- 

## Deployment environment specific things
Ways of setting deployment environment specific things:
 - FastAPI: `if "AWS_EXECUTION_ENV" in os.environ:`
 - React: setting environment variables on build with `REACT_APP_` prefix
### Things that are deployment-environment specific
- BASE_API_URL
- 

# plant
## Planned features
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
