# Step-by-Step Guide for Deploying E-Vote to Google Cloud

## 1. Prerequisites
- Google Cloud SDK installed (https://cloud.google.com/sdk/docs/install)
- Docker installed (https://docs.docker.com/get-docker/) - if building locally
- MongoDB account or self-hosted MongoDB setup
- Git installed

## 2. Project Setup

### 2.1 Clone the Repository
```bash
git clone <your-repository-url>
cd <repository-directory>
```

### 2.2 Set Up Google Cloud Project 
```bash
# Create a new project (or use an existing one)
gcloud projects create evote-app-deployment --name="E-Vote Application"

# Set the active project
gcloud config set project evote-app-deployment

# Enable required services
gcloud services enable containerregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
```

### 2.3 Create Artifact Repository
```bash
gcloud artifacts repositories create evote-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="E-Vote application repository"
```

## 3. Configure Environment Variables

### 3.1 Create the Secrets
Edit the `create-secrets.sh` file with your MongoDB URI and JWT secret:
```bash
# Replace these values in create-secrets.sh
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/evote?retryWrites=true&w=majority"
JWT_SECRET="your-jwt-secret-key"
```

### 3.2 Run the Secrets Creation Script
```bash
# Make the script executable
chmod +x create-secrets.sh

# Run the script
./create-secrets.sh
```

## 4. Build and Push Docker Images

### Option 1: Building with Docker locally (if Docker is installed)
```bash
# Configure Docker to authenticate with Google Cloud
gcloud auth configure-docker us-central1-docker.pkg.dev

# Build and tag the images
docker build -t us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/face-verification:v1 -f Dockerfile .
docker build -t us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/backend:v1 -f Dockerfile.backend .

# Push the images to Artifact Registry
docker push us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/face-verification:v1
docker push us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/backend:v1
```

### Option 2: Building with Google Cloud Build
```bash
# Submit the build to Cloud Build
gcloud builds submit --config=cloudbuild.yaml .
```

## 5. Deploy to Cloud Run

### 5.1 Deploy the Face Verification Service
```bash
gcloud run deploy face-verification \
  --image=us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/face-verification:v1 \
  --platform=managed \
  --region=us-central1 \
  --memory=2Gi \
  --cpu=2 \
  --port=5001 \
  --set-env-vars=PORT=5001,PYTHONUNBUFFERED=1,DEEPFACE_HOME=/app/deepface_weights \
  --allow-unauthenticated
```

### 5.2 Get the Face Verification Service URL
```bash
# Get the URL of the face verification service
FACE_VERIFICATION_URL=$(gcloud run services describe face-verification --platform=managed --region=us-central1 --format='value(status.url)')
echo $FACE_VERIFICATION_URL
```

### 5.3 Deploy the Backend Service
```bash
gcloud run deploy backend \
  --image=us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/backend:v1 \
  --platform=managed \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=1 \
  --port=3000 \
  --set-env-vars=NODE_ENV=production,PORT=3000,FACE_VERIFICATION_URL=$FACE_VERIFICATION_URL \
  --set-secrets=MONGODB_URI=mongodb-uri:latest,JWT_SECRET=jwt-secret:latest \
  --allow-unauthenticated
```

## 6. Set Up Service-to-Service Communication

### 6.1 Grant Permissions
```bash
# Get the service account for the backend service
BACKEND_SA=$(gcloud run services describe backend --platform=managed --region=us-central1 --format='value(spec.template.spec.serviceAccountName)')

# Grant the backend service permission to call the face verification service
gcloud run services add-iam-policy-binding face-verification \
  --member=serviceAccount:$BACKEND_SA \
  --role=roles/run.invoker \
  --region=us-central1
```

## 7. Test the Deployment

### 7.1 Test the Backend Service
```bash
# Get the URL of the backend service
BACKEND_URL=$(gcloud run services describe backend --platform=managed --region=us-central1 --format='value(status.url)')
echo $BACKEND_URL

# Test the health endpoint
curl $BACKEND_URL/health
```

### 7.2 Test the Face Verification Service
```bash
# Test the health endpoint of the face verification service
curl $FACE_VERIFICATION_URL/health
```

## 8. Monitoring and Maintenance

### 8.1 View Logs
```bash
# View logs for the backend service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=backend" --limit=10

# View logs for the face verification service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=face-verification" --limit=10
```

### 8.2 Configure Continuous Deployment (Optional)

Set up continuous deployment by connecting your repository to Cloud Build:

1. Go to Cloud Build > Triggers in the Google Cloud Console
2. Click "Create Trigger"
3. Connect your repository
4. Configure the build to run when you push to your main branch
5. Use the cloudbuild.yaml file for the build configuration

## 9. Scaling and Performance

### 9.1 Update Service Configuration
To adjust the scaling settings:

```bash
# Example: Update max instances for backend service
gcloud run services update backend \
  --max-instances=10 \
  --region=us-central1
```

## 10. Cleanup (when needed)
```bash
# Delete services
gcloud run services delete backend --region=us-central1
gcloud run services delete face-verification --region=us-central1

# Delete secrets
gcloud secrets delete mongodb-uri
gcloud secrets delete jwt-secret

# Delete images
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/backend:v1 \
  --delete-tags
gcloud artifacts docker images delete \
  us-central1-docker.pkg.dev/evote-app-deployment/evote-repo/face-verification:v1 \
  --delete-tags

# Delete repository
gcloud artifacts repositories delete evote-repo --location=us-central1
``` 