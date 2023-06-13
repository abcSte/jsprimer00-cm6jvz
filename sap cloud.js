name: api-docs

on:
  push:
    branches:
      - 'main'
      - 'v*-main'
    paths:
      - 'knowledge-base/api-reference/**'
  workflow_dispatch:

jobs:
  push-to-documentation-branch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Add key
        env:
          SSH_AUTH_SOCK: /tmp/ssh_agent.sock
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan github.com >> ~/.ssh/known_hosts
          echo "${{ secrets.GH_CLOUD_SDK_WRITE_KEY   }}" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          cat <<EOT >> ~/.ssh/config
          Host github.com
          HostName github.com
          IdentityFile ~/.ssh/id_rsa
          EOT
      - name: Push generated API documentation to the SAP/cloud-sdk repo
        env:
          USE_SSH: true
          GIT_USER: cloud-sdk-js
        run: |
          git config --global user.email "cloud-sdk-js@github.com"
          git config --global user.name "cloud-sdk-js"
          M_VERSION=`awk -F'"' '/"version": "[0-9\.]+"/{ print $4; exit; }' package.json | awk -F'.' '{print "v"$1; exit; }'`
          cd ..
          git clone --depth 1 git@github.com:SAP/cloud-sdk.git
          rsync -avz cloud-sdk-js/knowledge-base/api-reference/ cloud-sdk/static/api/$M_VERSION/
          cd cloud-sdk
          git add -A
          git commit -a -m "Update SAP Cloud SDK for JavaScript API documentation" || exit 0
          git push
          npm install -D @sap-cloud-sdk/openapi-generator
          
