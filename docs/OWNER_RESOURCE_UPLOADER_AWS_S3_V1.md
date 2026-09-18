# SVR Owner Resource Uploader — AWS S3 + PostgreSQL

## Scope
Owner panel only: `/site/owner.html`.

## Storage design
- Binary assets: private AWS S3 bucket.
- Metadata/index: existing PostgreSQL database through `DATABASE_URL`.
- Authentication: existing owner JWT; all resource API routes require `requireAdmin`.
- The public site receives no upload control.

## API routes
- `POST /api/admin/resources/presign`
- `POST /api/admin/resources/complete`
- `GET /api/admin/resources`

## Required API environment variables
```text
AWS_REGION=us-east-1
SVR_RESOURCE_BUCKET=<private-bucket-name>
AWS_ACCESS_KEY_ID=<secret>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_SESSION_TOKEN=<only-if-temporary-credentials>
SVR_RESOURCE_MAX_BYTES=262144000
```

Prefer an IAM principal restricted to only this bucket/prefix:
`arn:aws:s3:::<bucket>/resources/*`.

## Required S3 CORS
Configure the private bucket to permit the owner page to PUT a presigned object:
```json
[
  {
    "AllowedOrigins": ["https://svrpoker.com"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Keep Block Public Access enabled. Do not add a public-read bucket policy.

## Allowed resources
FBX, OBJ, GLB, GLTF, MTL, BLEND, ZIP, PNG, JPG/JPEG, WEBP, KTX2.

Default maximum object size: 250 MiB.

## Notes
The API creates the `resource_assets` table automatically if it is absent. The SQL file is included for explicit migration/audit use.
