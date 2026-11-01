---
title: AWS Fundamentals (example)
cert: Example decks
tags: [example, s3, iam, compute]
---

### Which AWS service provides object storage?

- [x] Amazon S3
- [ ] Amazon EBS
- [ ] Amazon EFS
- [ ] Amazon RDS

> S3 stores objects (files plus metadata) in buckets. EBS is block storage attached to an EC2 instance, EFS is a shared file system, and RDS is a managed relational database.

Learn more: [What is Amazon S3?](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html)

### Which of these let you run code without managing servers?

- [x] AWS Lambda
- [x] AWS Fargate
- [ ] Amazon EC2
- [ ] Amazon Lightsail

> Lambda runs functions and Fargate runs containers, and AWS manages the underlying servers for both. EC2 and Lightsail give you instances that you patch and scale yourself.

### An application on an EC2 instance needs to read from an S3 bucket.

What is the recommended way to give it access?

- [ ] Store an IAM user's access keys in the application's configuration.
- [x] Attach an IAM role to the instance with a policy that allows reading the bucket.
- [ ] Sign in as the account root user from the application.
- [ ] Add the instance to an IAM group.

> An instance role supplies temporary credentials that rotate automatically, so no long-lived keys are stored on the instance. IAM groups only contain users, and the root user should never be used by applications.

Learn more: [IAM roles for Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
