import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

const SETUP_SECRET = process.env.SETUP_SECRET || ''

export async function GET(request: NextRequest) {
    // Protect this admin-only route with a secret header
    const providedSecret = request.headers.get('x-setup-secret') || ''
    if (!SETUP_SECRET || providedSecret !== SETUP_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`

    await sql`CREATE OR REPLACE FUNCTION haversine(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
    RETURNS FLOAT AS $$
    DECLARE
      R FLOAT := 6371000;
      dlat FLOAT := radians(lat2 - lat1);
      dlng FLOAT := radians(lng2 - lng1);
      a FLOAT;
    BEGIN
      a := sin(dlat/2)^2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng/2)^2;
      RETURN R * 2 * atan2(sqrt(a), sqrt(1-a));
    END;
    $$ LANGUAGE plpgsql IMMUTABLE`

    await sql`CREATE TABLE IF NOT EXISTS memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lat FLOAT NOT NULL, lng FLOAT NOT NULL,
    content TEXT NOT NULL, year_label TEXT,
    contributor_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW())`

    await sql`CREATE TABLE IF NOT EXISTS echoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lat FLOAT NOT NULL, lng FLOAT NOT NULL,
    content TEXT NOT NULL, radius_m INTEGER DEFAULT 30,
    for_whom TEXT, expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW())`

    await sql`CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lat FLOAT NOT NULL, lng FLOAT NOT NULL,
    incident_type TEXT NOT NULL, time_of_day TEXT,
    day_of_week SMALLINT, contributor_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW())`

    await sql`CREATE TABLE IF NOT EXISTS static_pins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lat FLOAT NOT NULL, lng FLOAT NOT NULL,
    content TEXT NOT NULL, radius_m INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW())`

    await sql`CREATE TABLE IF NOT EXISTS emotional_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lat FLOAT NOT NULL, lng FLOAT NOT NULL,
    emotion TEXT NOT NULL, contributor_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW())`

    await sql`CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lat FLOAT NOT NULL, lng FLOAT NOT NULL,
    hour_of_day SMALLINT NOT NULL, day_of_week SMALLINT NOT NULL,
    contributor_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW())`

    await sql`CREATE INDEX IF NOT EXISTS idx_memories_geo ON memories(lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_echoes_geo ON echoes(lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_incidents_geo ON incidents(lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_static_pins_geo ON static_pins(lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_emotional_geo ON emotional_records(lat, lng)`
    await sql`CREATE INDEX IF NOT EXISTS idx_checkins_geo ON checkins(lat, lng)`

    return NextResponse.json({ success: true, message: 'Schema created!' })
}