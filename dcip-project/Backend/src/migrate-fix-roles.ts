/**
 * ONE-TIME migration — fixes users missing from the admin dashboard.
 *
 * What it does:
 *   1. Finds every user document where role is not 'student' and not 'admin'
 *      (missing, null, undefined, 'supervisor', or any other value).
 *   2. Prints a report so you can review before committing.
 *   3. Sets role = 'student' on those documents (safe default).
 *   4. Also renames any 'schoolId' field to 'school' if found.
 *
 * Run with:   npx ts-node src/migrate-fix-roles.ts
 * Add --apply to actually write changes (dry-run by default).
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from './config/db'

dotenv.config()

const APPLY = process.argv.includes('--apply')

async function run() {
  await connectDB()

  const db = mongoose.connection.db!
  const col = db.collection('users')

  // 1. Find users whose role is not 'student' or 'admin'
  const broken = await col.find({
    role: { $nin: ['student', 'admin'] },
  }).toArray()

  if (broken.length === 0) {
    console.log('No broken role documents found. All users have valid roles.')
  } else {
    console.log(`\nFound ${broken.length} user(s) with missing or invalid role:\n`)
    for (const u of broken) {
      console.log(`  _id: ${u._id}  |  username: ${u.username ?? '(none)'}  |  email: ${u.email ?? '(none)'}  |  role: ${JSON.stringify(u.role)}`)
    }

    if (APPLY) {
      const result = await col.updateMany(
        { role: { $nin: ['student', 'admin'] } },
        { $set: { role: 'student' } }
      )
      console.log(`\n  Applied: set role = 'student' on ${result.modifiedCount} document(s).`)
    } else {
      console.log('\n  DRY RUN — no changes made. Re-run with --apply to fix these documents.')
    }
  }

  // 2. Find users with a 'schoolId' field instead of 'school'
  const wrongField = await col.find({ schoolId: { $exists: true } }).toArray()

  if (wrongField.length === 0) {
    console.log('\nNo documents with legacy "schoolId" field found.')
  } else {
    console.log(`\nFound ${wrongField.length} user(s) with legacy "schoolId" field:\n`)
    for (const u of wrongField) {
      console.log(`  _id: ${u._id}  |  username: ${u.username ?? '(none)'}  |  schoolId: ${JSON.stringify(u.schoolId)}`)
    }

    if (APPLY) {
      for (const u of wrongField) {
        await col.updateOne(
          { _id: u._id },
          {
            $rename: { schoolId: 'school' },
          }
        )
      }
      console.log(`\n  Applied: renamed "schoolId" → "school" on ${wrongField.length} document(s).`)
    } else {
      console.log('\n  DRY RUN — no changes made. Re-run with --apply to rename the field.')
    }
  }

  await mongoose.disconnect()
  console.log('\nMigration complete.')
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
