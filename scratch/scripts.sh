# Testing API integration
curl https://2jbzjl9rj2.execute-api.us-west-2.amazonaws.com/test/plants

######################################
############# CI/Tests ################
######################################

cd ~/projects/plants
mypy ./backend

####################################################################################################
################################ Lambda function build and deploy ##################################
####################################################################################################

# Deploy original lambda API function
cd ~/projects/plants/backend
aws lambda create-function \
--profile plants \
--zip-file fileb://api_lambda.zip \
--handler backend.plant_api.main.handler \
--runtime python3.9 \
--function-name new-plant-app \
--role arn:aws:iam::593627358790:role/lambda_db_reader


###### Updating FastAPI backend lambda ######

# Install AWS compatible dependencies into a local directory to be packaged with the FastAPI backend
cd ~/projects/plants/backend
pip install \
--platform manylinux2014_x86_64 \
--target=../backend_deps \
--implementation cp \
--python-version 3.9 \
--only-binary=:all: --upgrade \
--index https://pypi.org/simple/ \
-r requirements.txt

# Package FastAPI backend and dependencies into a single zip file so it can be deployed to lambda
cd ~/projects/plants/backend_deps
zip -r ~/projects/plants/api_lambda.zip .
cd ~/projects/plants/
zip -g ./api_lambda.zip -r backend

# Deploy .zip to AWS lambda function
aws lambda update-function-code \
--profile plants \
--zip-file fileb://api_lambda.zip \
--function-name new-plant-app

####################################################################################################
################################## Local Development Environment ###################################
####################################################################################################

# Running FastAPI
export AWS_PROFILE=plants
cd ~/projects/plants
uvicorn backend.plant_api.main:app --reload

# Running react app
cd ~/projects/plants/plant-app
npm start


