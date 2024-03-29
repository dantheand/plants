# Testing API integration
curl https://2jbzjl9rj2.execute-api.us-west-2.amazonaws.com/test/plants

######################################
############# CI/Tests ################
######################################

# Trying different python versions
cd ~/projects/plants/backend
pyenv versions
pyenv local 3.12.1
poetry env use $(pyenv which python)
poetry install
poetry run pytest


## With poetry
cd ~/projects/plants/backend/
poetry run mypy .

cd ~/projects/plants/backend/
poetry run pytest tests

poetry run flake8 ./plant_api --count --select=E9,F63,F7,F82 --show-source --statistics
poetry run flake8 ./plant_api --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

####################################################################################################
################################ Lambda function build and deploy ##################################
####################################################################################################

# Deploy original lambda API function
cd ~/projects/plants/backend
aws lambda create-function \
--profile plants \
--zip-file fileb://api_lambda.zip \
--handler plant_api.main.handler \
--runtime python3.9 \
--function-name new-plant-app \
--role arn:aws:iam::593627358790:role/lambda_db_reader


###### Updating FastAPI backend lambda ######

# Install AWS compatible dependencies into a local directory to be packaged with the FastAPI backend
# Using poetry requirements (note: doesn't export dev requirements by default) ######
poetry shell
poetry env use 3.12.1
poetry export -f requirements.txt --output requirements_from_poetry.txt --without-hashes
rm -rf ../backend_deps
pip install \
--platform manylinux2014_x86_64 \
--target=../backend_deps \
--implementation cp \
--python-version 3.12 \
--only-binary=:all: --upgrade \
--index https://pypi.org/simple/ \
-r requirements_from_poetry.txt

# Package FastAPI backend and dependencies into a single zip file so it can be deployed to lambda
cd ~/projects/plants/backend_deps
rm -rf ../api_lambda.zip
zip -r ~/projects/plants/api_lambda.zip .
cd ~/projects/plants/backend
zip -g ../api_lambda.zip -r plant_api

# Deploy .zip to AWS lambda function
cd ~/projects/plants
aws lambda update-function-code \
--profile plants \
--zip-file fileb://api_lambda.zip \
--function-name new-plant-app

cd ~/projects/plants
rm -rf ./backend/api_lambda.zip
rm -rf ./backend_deps
rm -rf ./backend/requirements_from_poetry.txt


####################################################################################################
################################## Local Development Environment ###################################
####################################################################################################

# Running FastAPI
export AWS_PROFILE=plants
cd ~/projects/plants/backend
poetry run uvicorn plant_api.main:app --reload

# Running react app
cd ~/projects/plants/plant-app
npm start


