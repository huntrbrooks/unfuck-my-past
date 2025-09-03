import { NextRequest, NextResponse } from 'next/server'
import { db, programDays } from '../../../db'
import { programDays as programContent } from '../../../lib/program-content'

export async function POST(_request: NextRequest) {
  try {
    // Clear existing program days
    await db.delete(programDays)
    
    // Insert all program days
    for (const day of programContent) {
      await db.insert(programDays).values({
        day: day.day,
        title: day.title,
        copyStraight: day.copyStraight,
        copyGentle: day.copyGentle,
        metadata: day.metadata
      })
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Seeded ${programContent.length} program days successfully`
    })
    
  } catch (error) {
    console.error('Error seeding program content:', error)
    return NextResponse.json(
      { error: 'Failed to seed program content' },
      { status: 500 }
    )
  }
}

