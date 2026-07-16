@echo off
set CLOUDSDK_CORE_DISABLE_PROMPTS=1
echo Deploying BR Transport Backend to Google Cloud Run...
"C:\Users\ASEEL\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" run deploy brtransport-backend --source . --region us-central1 --allow-unauthenticated --project gokul-lorry --quiet
