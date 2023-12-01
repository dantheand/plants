# Package backend code into zip
cd ~/project/plant-app/plants
zip -r9 ./backend.zip ./backend

# Deploy lambda API function
aws lambda create-function \
--profile plants \
--zip-file fileb://backend.zip \
--handler backend.lambda_function.lambda_handler \
--runtime python3.9 \
--function-name plant-app \
--role arn:aws:iam::593627358790:role/lambda_db_reader

# Update lambda API function
aws lambda update-function-code \
--profile plants \
--zip-file fileb://backend.zip \
--function-name plant-app

# Testing API integration
curl https://2jbzjl9rj2.execute-api.us-west-2.amazonaws.com/test/plants