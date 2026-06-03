/**
 * AWS Integration Module
 * Handles communication with AWS services (RDS, Lambda, S3, Cognito)
 * 
 * Environment Variables Required:
 * - AWS_REGION
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - RDS_ENDPOINT
 * - COGNITO_USER_POOL_ID
 * - COGNITO_CLIENT_ID
 */

const AWS = require('aws-sdk');
const postgres = require('pg');
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const cognito = new AWS.CognitoIdentityServiceProvider();
const lambda = new AWS.Lambda();

// PostgreSQL connection pool for RDS
const pgPool = new postgres.Pool({
  user: process.env.RDS_USER || 'admin',
  password: process.env.RDS_PASSWORD,
  host: process.env.RDS_ENDPOINT,
  port: process.env.RDS_PORT || 5432,
  database: process.env.RDS_DATABASE || 'svr_game'
});

/**
 * DATABASE OPERATIONS
 */

class AWSGameDatabase {
  /**
   * Initialize database tables on first run
   */
  static async initializeTables() {
    const client = await pgPool.connect();
    try {
      // Players table
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          profile_data JSONB DEFAULT '{}',
          total_chips BIGINT DEFAULT 1000,
          meditation_sessions INT DEFAULT 0,
          reiki_room_visits INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Game sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS game_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          game_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          chips_won BIGINT DEFAULT 0,
          chips_lost BIGINT DEFAULT 0,
          duration_seconds INT DEFAULT 0,
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          FOREIGN KEY (player_id) REFERENCES players(id)
        );
      `);

      // Meditation sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS meditation_sessions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          room_id VARCHAR(50) NOT NULL,
          duration_seconds INT NOT NULL,
          meditation_type VARCHAR(50) DEFAULT 'reiki',
          mood_before VARCHAR(50),
          mood_after VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Private room access table
      await client.query(`
        CREATE TABLE IF NOT EXISTS room_access (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          room_id VARCHAR(50) NOT NULL,
          access_level VARCHAR(20) DEFAULT 'viewer',
          is_owner BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Game statistics table
      await client.query(`
        CREATE TABLE IF NOT EXISTS game_statistics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
          hands_played INT DEFAULT 0,
          wins INT DEFAULT 0,
          losses INT DEFAULT 0,
          total_earnings BIGINT DEFAULT 0,
          avg_pot_size INT DEFAULT 0,
          win_rate DECIMAL(5, 2) DEFAULT 0,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await client.query(`CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_meditation_player ON meditation_sessions(player_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_room_access_room ON room_access(room_id);`);

      console.log('✅ Database tables initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create or update player profile
   */
  static async savePlayerProfile(playerId, profileData) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `UPDATE players 
         SET profile_data = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [JSON.stringify(profileData), playerId]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get player statistics
   */
  static async getPlayerStats(playerId) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM game_statistics WHERE player_id = $1`,
        [playerId]
      );
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  /**
   * Log meditation session
   */
  static async logMeditationSession(playerId, sessionData) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO meditation_sessions 
         (player_id, room_id, duration_seconds, meditation_type, mood_before, mood_after, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          playerId,
          sessionData.roomId,
          sessionData.durationSeconds,
          sessionData.type || 'reiki',
          sessionData.moodBefore,
          sessionData.moodAfter,
          sessionData.notes
        ]
      );
      
      // Update meditation session count
      await client.query(
        `UPDATE players SET meditation_sessions = meditation_sessions + 1 WHERE id = $1`,
        [playerId]
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Create game session
   */
  static async createGameSession(playerId, gameType) {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `INSERT INTO game_sessions (player_id, game_type) 
         VALUES ($1, $2) 
         RETURNING *`,
        [playerId, gameType]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

/**
 * S3 OPERATIONS
 */

class AWSS3Manager {
  /**
   * Upload game asset to S3
   */
  static async uploadAsset(key, fileBuffer, contentType) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'svr-game-assets',
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read'
    };

    try {
      const data = await s3.upload(params).promise();
      console.log(`✅ Asset uploaded: ${data.Location}`);
      return data.Location;
    } catch (error) {
      console.error('❌ S3 upload error:', error);
      throw error;
    }
  }

  /**
   * Download asset from S3
   */
  static async downloadAsset(key) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'svr-game-assets',
      Key: key
    };

    try {
      const data = await s3.getObject(params).promise();
      return data.Body;
    } catch (error) {
      console.error('❌ S3 download error:', error);
      throw error;
    }
  }

  /**
   * List all assets in a directory
   */
  static async listAssets(prefix) {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET || 'svr-game-assets',
      Prefix: prefix
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      return data.Contents || [];
    } catch (error) {
      console.error('❌ S3 list error:', error);
      throw error;
    }
  }
}

/**
 * AUTHENTICATION (Cognito)
 */

class AWSCognitoAuth {
  /**
   * Register new user
   */
  static async registerUser(username, email, password) {
    const params = {
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: username,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        }
      ]
    };

    try {
      const data = await cognito.signUp(params).promise();
      console.log(`✅ User registered: ${username}`);
      return data;
    } catch (error) {
      console.error('❌ Cognito registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   */
  static async authenticateUser(username, password) {
    const params = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    };

    try {
      const data = await cognito.initiateAuth(params).promise();
      return {
        accessToken: data.AuthenticationResult.AccessToken,
        idToken: data.AuthenticationResult.IdToken,
        refreshToken: data.AuthenticationResult.RefreshToken
      };
    } catch (error) {
      console.error('❌ Cognito authentication error:', error);
      throw error;
    }
  }

  /**
   * Verify token
   */
  static async verifyToken(token) {
    const params = {
      AccessToken: token
    };

    try {
      const data = await cognito.getUser(params).promise();
      return data;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      throw error;
    }
  }
}

/**
 * LAMBDA INVOCATION
 */

class AWSLambdaManager {
  /**
   * Invoke Lambda function asynchronously
   */
  static async invokeLambda(functionName, payload) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'Event',
      Payload: JSON.stringify(payload)
    };

    try {
      const data = await lambda.invoke(params).promise();
      console.log(`✅ Lambda invoked: ${functionName}`);
      return data;
    } catch (error) {
      console.error('❌ Lambda invocation error:', error);
      throw error;
    }
  }

  /**
   * Invoke Lambda function synchronously
   */
  static async invokeLambdaSync(functionName, payload) {
    const params = {
      FunctionName: functionName,
      InvocationType: 'RequestResponse',
      Payload: JSON.stringify(payload)
    };

    try {
      const data = await lambda.invoke(params).promise();
      return JSON.parse(data.Payload);
    } catch (error) {
      console.error('❌ Lambda sync invocation error:', error);
      throw error;
    }
  }
}

/**
 * Export modules
 */
module.exports = {
  AWSGameDatabase,
  AWSS3Manager,
  AWSCognitoAuth,
  AWSLambdaManager,
  pgPool
};
