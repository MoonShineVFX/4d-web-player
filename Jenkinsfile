pipeline {
    environment {
        WEB_FOLDER = 'fdrecplayer'
    }
    agent {
        docker {
            image 'node:16-alpine'
        }
    }
    stages {
        stage('Install') {
            steps {
                sh 'yarn install'
            }
        }
        stage('Build') {
            steps {
                sh 'yarn run build-jenkins'
            }
        }
        stage('Deploy') {
            steps {
                sh "rm -rf /var/web/${WEB_FOLDER}"
                sh "mv ./build /var/web/${WEB_FOLDER}"
                sh "chmod -R 755 /var/web/${WEB_FOLDER}"
            }
        }
    }
}