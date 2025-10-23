import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime

def get_db_connection():
    '''Get database connection using DATABASE_URL from environment'''
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def serialize_player(player):
    '''Convert player dict with datetime to JSON-serializable dict'''
    result = dict(player)
    if 'created_at' in result and isinstance(result['created_at'], datetime):
        result['created_at'] = result['created_at'].isoformat()
    if 'updated_at' in result and isinstance(result['updated_at'], datetime):
        result['updated_at'] = result['updated_at'].isoformat()
    if 'last_visit' in result and isinstance(result['last_visit'], datetime):
        result['last_visit'] = result['last_visit'].isoformat()
    return result

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Game API for player management and progress
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with player data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            username = params.get('username')
            
            if username:
                cur.execute(
                    "SELECT * FROM players WHERE username = %s",
                    (username,)
                )
                player = cur.fetchone()
                
                if player:
                    cur.execute(
                        "SELECT business_type, count FROM businesses WHERE player_id = %s",
                        (player['id'],)
                    )
                    businesses = cur.fetchall()
                    
                    cur.execute(
                        "SELECT car_type, count FROM cars WHERE player_id = %s",
                        (player['id'],)
                    )
                    cars = cur.fetchall()
                    
                    cur.execute(
                        "SELECT house_type, count FROM houses WHERE player_id = %s",
                        (player['id'],)
                    )
                    houses = cur.fetchall()
                    
                    cur.execute(
                        "UPDATE players SET total_visits = total_visits + 1, last_visit = CURRENT_TIMESTAMP WHERE id = %s",
                        (player['id'],)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'player': serialize_player(player),
                            'businesses': [dict(b) for b in businesses],
                            'cars': [dict(c) for c in cars],
                            'houses': [dict(h) for h in houses]
                        })
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Player not found'})
                    }
            
            cur.execute("SELECT id, username, balance, status, is_admin FROM players ORDER BY balance DESC LIMIT 100")
            players = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'players': [serialize_player(p) for p in players]})
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username')
            
            cur.execute(
                "INSERT INTO players (username) VALUES (%s) ON CONFLICT (username) DO NOTHING RETURNING *",
                (username,)
            )
            player = cur.fetchone()
            
            if not player:
                cur.execute("SELECT * FROM players WHERE username = %s", (username,))
                player = cur.fetchone()
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'player': serialize_player(player)})
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username')
            balance = body.get('balance')
            donat_balance = body.get('donat_balance')
            status = body.get('status')
            businesses = body.get('businesses', {})
            cars = body.get('cars', {})
            houses = body.get('houses', {})
            is_admin = body.get('is_admin')
            total_clicks = body.get('total_clicks')
            
            cur.execute("SELECT id FROM players WHERE username = %s", (username,))
            player = cur.fetchone()
            
            if not player:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Player not found'})
                }
            
            player_id = player['id']
            
            update_fields = []
            update_values = []
            
            if balance is not None:
                update_fields.append("balance = %s")
                update_values.append(balance)
            if donat_balance is not None:
                update_fields.append("donat_balance = %s")
                update_values.append(donat_balance)
            if status is not None:
                update_fields.append("status = %s")
                update_values.append(status)
            if is_admin is not None:
                update_fields.append("is_admin = %s")
                update_values.append(is_admin)
            if total_clicks is not None:
                update_fields.append("total_clicks = %s")
                update_values.append(total_clicks)
            
            if update_fields:
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                update_values.append(player_id)
                cur.execute(
                    f"UPDATE players SET {', '.join(update_fields)} WHERE id = %s",
                    update_values
                )
            
            for business_type, count in businesses.items():
                if count > 0:
                    cur.execute(
                        "INSERT INTO businesses (player_id, business_type, count) VALUES (%s, %s, %s) ON CONFLICT (player_id, business_type) DO UPDATE SET count = %s",
                        (player_id, int(business_type), count, count)
                    )
                else:
                    cur.execute(
                        "DELETE FROM businesses WHERE player_id = %s AND business_type = %s",
                        (player_id, int(business_type))
                    )
            
            for car_type, count in cars.items():
                if count > 0:
                    cur.execute(
                        "INSERT INTO cars (player_id, car_type, count) VALUES (%s, %s, %s) ON CONFLICT (player_id, car_type) DO UPDATE SET count = %s",
                        (player_id, int(car_type), count, count)
                    )
                else:
                    cur.execute(
                        "DELETE FROM cars WHERE player_id = %s AND car_type = %s",
                        (player_id, int(car_type))
                    )
            
            for house_type, count in houses.items():
                if count > 0:
                    cur.execute(
                        "INSERT INTO houses (player_id, house_type, count) VALUES (%s, %s, %s) ON CONFLICT (player_id, house_type) DO UPDATE SET count = %s",
                        (player_id, int(house_type), count, count)
                    )
                else:
                    cur.execute(
                        "DELETE FROM houses WHERE player_id = %s AND house_type = %s",
                        (player_id, int(house_type))
                    )
            
            conn.commit()
            
            cur.execute("SELECT * FROM players WHERE id = %s", (player_id,))
            updated_player = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'player': serialize_player(updated_player)})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    finally:
        cur.close()
        conn.close()