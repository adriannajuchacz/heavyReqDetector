#!/bin/bash

start_time=$(date -d "6 hours ago" '+%Y-%m-%dT%H:%M:%S')
now=$(/usr/local/bin/date '+%Y-%m-%dT%H:%M:%S')

aws --output json cloudwatch get-metric-statistics --namespace AWS/NetworkELB \
    --metric-name ActiveFlowCount --statistics Sum  --period 3600 \
    --dimensions Name=LoadBalancer,Value=net/YourHash1/YourHash2 \
    --start-time $start_time --end-time $now

aws --output json cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=i-0102faac30e4c731a \
    --statistics Maximum \
    --start-time 2021-09-23T05:45:00 \
    --end-time 2021-09-23T09:00:00 \
    --period 900 > urls.json

aws logs start-query --log-group-name prod.aaron.ai --start-time 2021-09-23T08:25:00 --end-time 2021-09-23T08:30:00 --query-string 'fields @timestamp, responseTime | filter @logStream like "biz" and message like "request completed" and req.url like "/v/dev-0.0/tenants/authentication/token" | stats avg(responseTime)'