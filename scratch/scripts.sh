## Package backend code into zip
#cd ~/project/plants
#zip -r9 ./backend.zip ./backend
#
## Deploy lambda API function
#aws lambda create-function \
#--profile plants \
#--zip-file fileb://backend.zip \
#--handler backend.lambda_function.lambda_handler \
#--runtime python3.9 \
#--function-name plant-app \
#--role arn:aws:iam::593627358790:role/lambda_db_reader
#
## Update lambda API function
#aws lambda update-function-code \
#--profile plants \
#--zip-file fileb://backend.zip \
#--function-name plant-app

# Testing API integration
curl https://2jbzjl9rj2.execute-api.us-west-2.amazonaws.com/test/plants

## Package dependencies and lambda into zip
#cd ~/projects/plants/venv/lib/python3.9/site-packages
#zip -r9 ~/projects/plants/backend.zip .
#cd ~/projects/plants
#zip -g ./backend.zip -r backend

# Deploy original lambda API function
aws lambda create-function \
--profile plants \
--zip-file fileb://api_lambda.zip \
--handler api.main.handler \
--runtime python3.9 \
--function-name plant-app \
--role arn:aws:iam::593627358790:role/lambda_db_reader


# Install AWS compatible dependencies
cd ~/projects/plants
pip install \
--platform manylinux2014_x86_64 \
--target=api_deps \
--implementation cp \
--python-version 3.9 \
--only-binary=:all: --upgrade \
--index https://pypi.org/simple/ \
-r api/requirements.txt

# Package lambda
cd ~/projects/plants/api_deps
zip -r ~/projects/plants/api_lambda.zip .
cd ~/projects/plants
zip -g ./api_lambda.zip -r api

# Updating lambda function w/ FastAPI backend
aws lambda update-function-code \
--profile plants \
--zip-file fileb://api_lambda.zip \
--function-name plant-app

####################################################################################################
################################## Local Development Environment ###################################
####################################################################################################

# Running FastAPI
cd ~/projects/plants
uvicorn api.main:app --reload

# Running react app
cd ~/projects/plants/plant-app
npm start


