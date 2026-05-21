import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { UserModel } from '../src/models/User';
import { IssueModel } from '../src/models/Issue';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/issue-tracker';

interface OidWrap {
  $oid: string;
}
interface DateWrap {
  $date: string;
}

interface SeedUser {
  _id: OidWrap;
  email: string;
  password: string;
  name: string;
  createdAt: DateWrap;
  updatedAt: DateWrap;
}

interface SeedIssue {
  _id: OidWrap;
  title: string;
  description: string;
  status: string;
  priority: string;
  severity: string;
  createdBy: OidWrap;
  assignedTo: OidWrap | null;
  createdAt: DateWrap;
  updatedAt: DateWrap;
}

const transformDocs = <T extends Record<string, unknown>>(docs: T[]) =>
  docs.map((doc) => {
    const out: Record<string, unknown> = { ...doc };
    for (const key of Object.keys(out)) {
      const v = out[key];
      if (v && typeof v === 'object' && '$oid' in (v as object)) {
        out[key] = new mongoose.Types.ObjectId((v as OidWrap).$oid);
      } else if (v && typeof v === 'object' && '$date' in (v as object)) {
        out[key] = new Date((v as DateWrap).$date);
      }
    }
    return out;
  });

async function main() {
  console.log('Connecting to', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  const usersPath = path.join(__dirname, 'users.json');
  const issuesPath = path.join(__dirname, 'issues.json');

  const users: SeedUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const issues: SeedIssue[] = JSON.parse(fs.readFileSync(issuesPath, 'utf-8'));

  console.log(`Wiping existing users + issues...`);
  await UserModel.deleteMany({});
  await IssueModel.deleteMany({});

  console.log(`Inserting ${users.length} users...`);
  await UserModel.insertMany(transformDocs(users));

  console.log(`Inserting ${issues.length} issues...`);
  await IssueModel.insertMany(transformDocs(issues));

  console.log('✅ Seed complete');
  console.log('\nLogin credentials (password for all: see notes):');
  for (const u of users) console.log(`  - ${u.email}  (${u.name})`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
