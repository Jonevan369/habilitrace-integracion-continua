pipeline {
  agent any

  tools {
    nodejs 'NodeJS-20'
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    NODE_ENV = 'test'
    COMPOSE_PROJECT_NAME = "habilitrace_ci_${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: 'main',
          url: 'https://github.com/Jonevan369/habilitrace-integracion-continua'
      }
    }

    stage('Install Dependencies') {
      steps {
        sh 'node --version && npm --version'
        sh 'npm ci'
      }
    }

    stage('Backend Tests') {
      steps {
        sh 'npm test -w server'
      }
    }

    stage('Frontend Build') {
      steps {
        sh 'npm run build'
      }
    }

    stage('Validate Docker Compose') {
      steps {
        sh 'docker ps'
        sh 'docker compose config'
      }
    }

    stage('Build containers') {
      steps {
        sh 'docker compose build'
      }
    }
  }

  post {
    always {
      sh 'docker compose down --volumes --remove-orphans || true'
    }
    success {
      echo 'HabiliTrace CI pipeline completed successfully.'
    }
    failure {
      echo 'HabiliTrace CI pipeline failed. Review the failing stage logs in Jenkins.'
    }
  }
}
