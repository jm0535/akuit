import { PrismaClient } from '@prisma/client'
import { unlink, readdir, rm } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const prisma = new PrismaClient()
const UPLOAD_DIR = '/home/savi/workspace/projects/github/web_apps/app_tests/in4metrix/akuit/uploads/akuit'

async function reset() {
  console.log('🚀 Starting Full System Reset...')

  try {
    // 1. Delete all database records
    console.log('📦 Clearing Database...')
    const deleteIssues = prisma.issue.deleteMany()
    const deleteDocs = prisma.acquittalDocument.deleteMany()
    const deleteReports = prisma.acquittalReport.deleteMany()

    await prisma.$transaction([deleteIssues, deleteDocs, deleteReports])
    console.log('✅ Database cleared.')

    // 2. Delete all files in uploads/akuit
    console.log('📁 Clearing Uploads Directory...')
    if (existsSync(UPLOAD_DIR)) {
      const files = await readdir(UPLOAD_DIR)
      for (const file of files) {
        if (file === '.gitkeep') continue
        await unlink(join(UPLOAD_DIR, file))
      }
      console.log(`✅ Deleted ${files.length} files from ${UPLOAD_DIR}`)
    } else {
      console.log('ℹ️ Uploads directory does not exist, skipping.')
    }

    console.log('✨ System Reset Complete! Clean slate achieved.')
  } catch (error) {
    console.error('❌ Reset failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

reset()
