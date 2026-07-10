/**
 * ONE-TIME migration — fixes students with broken school references.
 *
 * Root cause: `npm run seed` deleted all School documents and recreated them
 * with new ObjectIds. Students who registered before the seed still hold the
 * old (now-deleted) school ObjectId, so populate() returns null for them.
 *
 * What this script does:
 *   1. Lists all current schools with their IDs (dry-run always).
 *   2. Finds every student whose school field does not match any current school.
 *   3. Groups them by their stale school ID so you can see what needs fixing.
 *   4. With --apply <targetSchoolId>, reassigns ALL broken students to that school.
 *
 * Run:
 *   npx ts-node src/migrate-fix-schools.ts
 *   npx ts-node src/migrate-fix-schools.ts --apply <schoolId>
 */

import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from './config/db'

dotenv.config()

const applyIdx = process.argv.indexOf('--apply')
const APPLY = applyIdx !== -1
const TARGET_SCHOOL_ID = APPLY ? process.argv[applyIdx + 1] : null

async function run() {
  await connectDB()

  const db = mongoose.connection.db!
  const schools = db.collection('schools')
  const users   = db.collection('users')

  // 1. List current schools
  const currentSchools = await schools.find({}).toArray()
  console.log(`\nCurrent schools in database (${currentSchools.length}):`)
  for (const s of currentSchools) {
    console.log(`  ${s._id}  →  ${s.name} (${s.district})`)
  }

  const currentSchoolIds = currentSchools.map(s => s._id.toString())

  // 2. Find all students
  const allStudents = await users.find({ role: 'student' }).toArray()
  console.log(`\nTotal students: ${allStudents.length}`)

  // 3. Find students with broken school references
  const broken = allStudents.filter(u => {
    if (!u.school) return false // null school — different issue
    return !currentSchoolIds.includes(u.school.toString())
  })

  const nullSchool = allStudents.filter(u => !u.school)

  if (nullSchool.length > 0) {
    console.log(`\nStudents with no school set (school: null): ${nullSchool.length}`)
    for (const u of nullSchool) {
      console.log(`  ${u._id}  |  ${u.username}  |  ${u.fullName}`)
    }
  }

  if (broken.length === 0) {
    console.log('\nNo students with broken school references found.')
  } else {
    console.log(`\nStudents with stale/broken school references: ${broken.length}`)

    // Group by old school ID
    const byOldId: Record<string, typeof broken> = {}
    for (const u of broken) {
      const key = u.school.toString()
      if (!byOldId[key]) byOldId[key] = []
      byOldId[key].push(u)
    }

    for (const [oldId, group] of Object.entries(byOldId)) {
      console.log(`\n  Old school ID: ${oldId}  (${group.length} student(s))`)
      for (const u of group) {
        console.log(`    - ${u.username}  (${u.fullName})`)
      }
    }

    if (APPLY) {
      if (!TARGET_SCHOOL_ID) {
        console.log('\nERROR: --apply requires a school ID. Copy one from the list above and re-run:')
        console.log('  npx ts-node src/migrate-fix-schools.ts --apply <schoolId>')
        process.exit(1)
      }

      // Validate target school exists
      const target = currentSchools.find(s => s._id.toString() === TARGET_SCHOOL_ID)
      if (!target) {
        console.log(`\nERROR: School ID "${TARGET_SCHOOL_ID}" not found in current schools.`)
        process.exit(1)
      }

      console.log(`\nApplying: reassigning ${broken.length} student(s) to "${target.name}"...`)

      const result = await users.updateMany(
        {
          role: 'student',
          school: { $nin: currentSchools.map(s => s._id) },
          $and: [{ school: { $ne: null } }, { school: { $exists: true } }],
        },
        { $set: { school: new mongoose.Types.ObjectId(TARGET_SCHOOL_ID) } }
      )

      console.log(`  Done — updated ${result.modifiedCount} student(s).`)
    } else {
      console.log('\nDRY RUN — no changes made.')
      console.log('To fix, run:')
      console.log('  npx ts-node src/migrate-fix-schools.ts --apply <schoolId>')
      console.log('(Replace <schoolId> with the correct current school ID from the list above.)')
    }
  }

  await mongoose.disconnect()
  console.log('\nDone.')
}

run().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
