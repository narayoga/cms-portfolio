/**
 * Reorganize /uploads into one folder per type of content.
 *
 *   npm run uploads:reorganize              -> DRY RUN: only writes a report, changes nothing
 *   npm run uploads:reorganize -- --execute -> really moves files and updates the database
 *
 * What --execute does:
 *   1. Saves a restore file: backups/before-reorganize-<time>.sql
 *      (running it puts every old path back in the database)
 *   2. Moves every used file to its new folder with a clean name
 *      ("projects/Park Hyatt.jpg" -> "projects/park-hyatt.jpg")
 *   3. Updates every path in the database (one transaction: all or nothing)
 *   4. Updates the paths that are written directly in the frontend code
 *   5. Moves files that nothing uses to backend-express/uploads-unused/
 *   6. Checks that every path in the database points to an existing file
 */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { queryAll, withTransaction, closeDatabase } from '../src/lib/db';
import { UPLOADS_DIR, PROJECT_ROOT, REPOSITORY_ROOT } from '../src/config/env';

const IS_EXECUTE = process.argv.includes('--execute');

const UNUSED_DIR = path.join(PROJECT_ROOT, 'uploads-unused');
const BACKUPS_DIR = path.join(PROJECT_ROOT, 'backups');

// ---------------------------------------------------------------------------
// 1. Where every kind of image belongs
// ---------------------------------------------------------------------------

type PathColumn = {
  table: string;
  column: string;
  primaryKey: string;
  // "single" = the column holds one path, "list" = paths separated by new lines,
  // "html" = paths inside HTML (src="/uploads/...")
  format: 'single' | 'list' | 'html';
  folder: string;
  // site_settings: the folder depends on the setting key
  folderPerKey?: Record<string, string>;
};

// The order matters: when one file is used in two places, the first place
// decides its folder (paths in FRONTEND_REFERENCES are checked before these).
const PATH_COLUMNS: PathColumn[] = [
  { table: 'site_settings', column: 'value', primaryKey: 'key', format: 'single', folder: 'site',
    folderPerKey: { homepage_about_logo: 'site/logo', homepage_services_image: 'site/home' } },
  { table: 'homepage_banners', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'banners' },
  { table: 'partner_brands', column: 'logo_path', primaryKey: 'id', format: 'single', folder: 'brands' },
  { table: 'sub_subcategories', column: 'brand_logo', primaryKey: 'id', format: 'single', folder: 'brands' },
  { table: 'categories', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'catalog/categories' },
  { table: 'subcategories', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'catalog/subcategories' },
  { table: 'sub_subcategories', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'catalog/items' },
  { table: 'sub_subcategory_features', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'catalog/features' },
  { table: 'sub_subcategory_features', column: 'images', primaryKey: 'id', format: 'list', folder: 'catalog/features' },
  { table: 'products', column: 'cover_image', primaryKey: 'id', format: 'single', folder: 'products' },
  { table: 'product_images', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'products' },
  { table: 'projects', column: 'cover_image', primaryKey: 'id', format: 'single', folder: 'projects' },
  { table: 'publications', column: 'cover_image', primaryKey: 'id', format: 'single', folder: 'publications' },
  { table: 'downloads', column: 'image_path', primaryKey: 'id', format: 'single', folder: 'downloads/thumbnails' },
  { table: 'downloads', column: 'file_path', primaryKey: 'id', format: 'single', folder: 'downloads/files' },
  { table: 'story_milestones', column: 'image_url', primaryKey: 'id', format: 'single', folder: 'story' },
  { table: 'services_page', column: 'hero_image', primaryKey: 'id', format: 'single', folder: 'site/services' },
  // Images placed inside articles with the text editor
  { table: 'products', column: 'content_html', primaryKey: 'id', format: 'html', folder: 'content' },
  { table: 'projects', column: 'content_html', primaryKey: 'id', format: 'html', folder: 'content' },
  { table: 'publications', column: 'content_html', primaryKey: 'id', format: 'html', folder: 'content' },
  { table: 'services_page', column: 'content_html', primaryKey: 'id', format: 'html', folder: 'content' },
];

// Paths written directly in the frontend code
type FrontendReference = { file: string; oldPath: string; folder: string };

const FRONTEND_REFERENCES: FrontendReference[] = [
  { file: 'frontend/src/components/public/Header.jsx', oldPath: '/uploads/15_SAG-warna-ri4cltobofltnbnvjndxax4uuic9o83fh7mq7ac1wy.png', folder: 'site/logo' },
  { file: 'frontend/src/components/public/Header.jsx', oldPath: '/uploads/mega-menu-products.webp', folder: 'site/mega-menu' },
  { file: 'frontend/src/components/public/Header.jsx', oldPath: '/uploads/mega-menu-banner.jpg', folder: 'site/mega-menu' },
  { file: 'frontend/src/components/public/Header.jsx', oldPath: '/uploads/mega-menu-download.webp', folder: 'site/mega-menu' },
  { file: 'frontend/src/pages/public/Home.jsx', oldPath: '/uploads/Door-hardware.jpeg', folder: 'site/home' },
  { file: 'frontend/src/pages/public/Home.jsx', oldPath: '/uploads/Automatic-Doors.jpeg', folder: 'site/home' },
  { file: 'frontend/src/pages/public/Home.jsx', oldPath: '/uploads/Electronic-Access.jpeg', folder: 'site/home' },
  { file: 'frontend/src/pages/public/Home.jsx', oldPath: '/uploads/Smart-Home.jpeg', folder: 'site/home' },
  { file: 'frontend/src/pages/public/Services.jsx', oldPath: '/uploads/mega-menu-banner.jpg', folder: 'site/mega-menu' },
  { file: 'frontend/src/pages/public/Services.jsx', oldPath: '/uploads/Spesification-and-Consultation.webp', folder: 'site/services' },
  { file: 'frontend/src/pages/public/Services.jsx', oldPath: '/uploads/After-Sales-Service.webp', folder: 'site/services' },
  { file: 'frontend/src/pages/public/DownloadCenter.jsx', oldPath: '/uploads/Web-Banner-Download-Center.jpg', folder: 'site/download-center' },
  { file: 'frontend/src/pages/public/ProductList.jsx', oldPath: '/uploads/catalog/10_placeholder.png', folder: 'catalog' },
];

// ---------------------------------------------------------------------------
// 2. Helpers
// ---------------------------------------------------------------------------

/**
 * "/uploads/projects/Park Hyatt.jpg" -> full path on disk
 */
function diskPathFor(uploadPath: string): string {
  const relativePath = uploadPath.replace(/^\/uploads\//, '');
  return path.join(UPLOADS_DIR, relativePath);
}

/**
 * Make a clean file name:
 *   "10_Botanica-Apartment-scaled.jpg"                 -> "botanica-apartment.jpg"
 *   "16_WILKA-ri4clsqf4315nmn41xrvmwr5pm9bskz6f2h6.jpg" -> "wilka.jpg"
 *   "Bintaro Jaya Rs Pondok Indah.jpeg"                 -> "bintaro-jaya-rs-pondok-indah.jpeg"
 */
function makeCleanFileName(oldPath: string): string {
  const parsedPath = path.posix.parse(oldPath);
  let name = parsedPath.name;
  const extension = parsedPath.ext.toLowerCase();

  name = name.replace(/^\d+_/, ''); // "10_Botanica" -> "Botanica"
  name = name.replace(/^\d+\.-/, ''); // "1.-PH-3301" -> "PH-3301"
  name = name.replace(/^\d+-(?=[A-Za-z])/, ''); // "1-Catalogue-Wilka" -> "Catalogue-Wilka"
  name = name.replace(/-[a-z0-9]{30,}$/i, ''); // WordPress random code at the end
  name = name.replace(/-scaled$/i, '');
  name = name.replace(/_(png|jpe?g|webp)$/i, ''); // "Cover_png" -> "Cover"

  name = name.replace(/'/g, ''); // "Fidelio's" -> "Fidelios"
  name = name.toLowerCase();
  name = name.replace(/[^a-z0-9]+/g, '-');
  name = name.replace(/^-+/, '');
  name = name.replace(/-+$/, '');

  if (name === '') {
    name = 'file';
  }

  return name + extension;
}

/**
 * Find every "/uploads/..." path inside a piece of HTML.
 */
function findPathsInHtml(html: string): string[] {
  const foundPaths: string[] = [];
  const pattern = /(?:https?:\/\/[^\/"'\s]+)?(\/uploads\/[^"'\s)<>]+)/g;

  let match = pattern.exec(html);
  while (match !== null) {
    foundPaths.push(decodeURI(match[1]));
    match = pattern.exec(html);
  }

  return foundPaths;
}

/**
 * The upload paths stored in one database value.
 */
function pathsInValue(value: string, format: string): string[] {
  if (format === 'html') {
    return findPathsInHtml(value);
  }

  if (format === 'list') {
    const paths: string[] = [];
    for (const line of value.split('\n')) {
      const cleanLine = line.trim();
      if (cleanLine.startsWith('/uploads/')) {
        paths.push(cleanLine);
      }
    }
    return paths;
  }

  if (value.startsWith('/uploads/')) {
    return [value];
  }
  return [];
}

/**
 * Replace the old paths in one database value with the new paths.
 */
function replacePathsInValue(value: string, format: string, newPathFor: Map<string, string>): string {
  if (format === 'single') {
    const newPath = newPathFor.get(value);
    if (newPath === undefined) {
      return value;
    }
    return newPath;
  }

  if (format === 'list') {
    const newLines: string[] = [];
    for (const line of value.split('\n')) {
      const newPath = newPathFor.get(line.trim());
      if (newPath === undefined) {
        newLines.push(line);
      } else {
        newLines.push(newPath);
      }
    }
    return newLines.join('\n');
  }

  // html: also turns "http://localhost:8000/uploads/..." into "/uploads/..."
  return value.replace(/(?:https?:\/\/[^\/"'\s]+)?(\/uploads\/[^"'\s)<>]+)/g, function (fullMatch, uploadPath) {
    const newPath = newPathFor.get(decodeURI(uploadPath));
    if (newPath === undefined) {
      return fullMatch;
    }
    return newPath;
  });
}

/**
 * Every file inside a folder (and its sub folders), as "/uploads/..." paths.
 */
function listAllUploads(folder: string): string[] {
  const uploadPaths: string[] = [];

  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const fullPath = path.join(folder, entry.name);

    if (entry.isDirectory()) {
      const filesInSubFolder = listAllUploads(fullPath);
      for (const uploadPath of filesInSubFolder) {
        uploadPaths.push(uploadPath);
      }
    } else if (entry.name !== '.gitkeep') {
      const relativePath = path.relative(UPLOADS_DIR, fullPath).split(path.sep).join('/');
      uploadPaths.push('/uploads/' + relativePath);
    }
  }

  return uploadPaths;
}

function removeEmptyFolders(folder: string): void {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      removeEmptyFolders(path.join(folder, entry.name));
    }
  }

  const isUploadsRoot = path.resolve(folder) === path.resolve(UPLOADS_DIR);
  if (isUploadsRoot === false && fs.readdirSync(folder).length === 0) {
    fs.rmdirSync(folder);
  }
}

// ---------------------------------------------------------------------------
// 3. Build the plan: old path -> new path
// ---------------------------------------------------------------------------

type DatabaseValue = { pathColumn: PathColumn; primaryKeyValue: string | number; value: string };

async function readDatabaseValues(): Promise<DatabaseValue[]> {
  const databaseValues: DatabaseValue[] = [];

  for (const pathColumn of PATH_COLUMNS) {
    const rows = await queryAll(
      'SELECT `' + pathColumn.primaryKey + '` AS primary_key_value, `' + pathColumn.column + '` AS value ' +
        'FROM `' + pathColumn.table + '` WHERE `' + pathColumn.column + "` LIKE '%/uploads/%' " +
        'ORDER BY `' + pathColumn.primaryKey + '`'
    );

    for (const row of rows) {
      databaseValues.push({ pathColumn: pathColumn, primaryKeyValue: row.primary_key_value, value: row.value });
    }
  }

  return databaseValues;
}

function folderForValue(databaseValue: DatabaseValue): string {
  const pathColumn = databaseValue.pathColumn;

  if (pathColumn.folderPerKey !== undefined) {
    const folderForThisKey = pathColumn.folderPerKey[String(databaseValue.primaryKeyValue)];
    if (folderForThisKey !== undefined) {
      return folderForThisKey;
    }
  }

  return pathColumn.folder;
}

type Plan = {
  newPathFor: Map<string, string>; // old path -> new path
  missingFiles: string[]; // used somewhere but the file does not exist
  unusedFiles: string[]; // the file exists but nothing uses it
};

function buildPlan(databaseValues: DatabaseValue[]): Plan {
  const newPathFor = new Map<string, string>();
  const takenNewPaths = new Set<string>(); // lower case, because Windows ignores case
  const missingFiles: string[] = [];

  function planOnePath(oldPath: string, folder: string) {
    if (newPathFor.has(oldPath)) {
      return; // already planned (the file is used in more than one place)
    }

    if (fs.existsSync(diskPathFor(oldPath)) === false) {
      if (missingFiles.includes(oldPath) === false) {
        missingFiles.push(oldPath);
      }
      return;
    }

    const cleanFileName = makeCleanFileName(oldPath);
    let newPath = '/uploads/' + folder + '/' + cleanFileName;

    // Two different files want the same name: add the old folder name in front,
    // and if that is still taken, add a number at the end.
    if (takenNewPaths.has(newPath.toLowerCase())) {
      const oldFolderName = path.posix.basename(path.posix.dirname(oldPath));
      const folderPrefix = makeCleanFileName(oldFolderName).replace(/\.$/, '');
      newPath = '/uploads/' + folder + '/' + folderPrefix + '-' + cleanFileName;
    }
    let counter = 2;
    const parsedNewPath = path.posix.parse(newPath);
    while (takenNewPaths.has(newPath.toLowerCase())) {
      newPath = parsedNewPath.dir + '/' + parsedNewPath.name + '-' + counter + parsedNewPath.ext;
      counter = counter + 1;
    }

    newPathFor.set(oldPath, newPath);
    takenNewPaths.add(newPath.toLowerCase());
  }

  // Paths in the frontend code are planned first: they are the most specific
  // (for example the catalog placeholder belongs in catalog/, not catalog/features/)
  for (const reference of FRONTEND_REFERENCES) {
    planOnePath(reference.oldPath, reference.folder);
  }

  for (const databaseValue of databaseValues) {
    const folder = folderForValue(databaseValue);
    for (const oldPath of pathsInValue(databaseValue.value, databaseValue.pathColumn.format)) {
      planOnePath(oldPath, folder);
    }
  }

  const unusedFiles: string[] = [];
  for (const uploadPath of listAllUploads(UPLOADS_DIR)) {
    if (newPathFor.has(uploadPath) === false) {
      unusedFiles.push(uploadPath);
    }
  }

  return { newPathFor: newPathFor, missingFiles: missingFiles, unusedFiles: unusedFiles };
}

function writeReport(plan: Plan, databaseValues: DatabaseValue[], timestamp: string): string {
  const lines: string[] = [];
  lines.push('UPLOADS REORGANIZE REPORT (' + (IS_EXECUTE ? 'EXECUTE' : 'DRY RUN') + ') ' + timestamp);
  lines.push('');

  // Group the moves by their new folder so the report is easy to read
  const movesPerFolder = new Map<string, string[]>();
  for (const [oldPath, newPath] of plan.newPathFor) {
    const newFolder = path.posix.dirname(newPath);
    if (movesPerFolder.has(newFolder) === false) {
      movesPerFolder.set(newFolder, []);
    }
    let marker = '';
    if (oldPath === newPath) {
      marker = '   (stays)';
    }
    movesPerFolder.get(newFolder)!.push('  ' + oldPath + '\n      -> ' + newPath + marker);
  }

  const sortedFolders = Array.from(movesPerFolder.keys()).sort();
  for (const folder of sortedFolders) {
    const moves = movesPerFolder.get(folder)!;
    lines.push('== ' + folder + '  (' + moves.length + ' files)');
    for (const move of moves) {
      lines.push(move);
    }
    lines.push('');
  }

  lines.push('== Files that nothing uses -> uploads-unused/  (' + plan.unusedFiles.length + ' files)');
  for (const unusedFile of plan.unusedFiles) {
    lines.push('  ' + unusedFile);
  }
  lines.push('');

  lines.push('== Used but MISSING on disk (left unchanged)  (' + plan.missingFiles.length + ')');
  for (const missingFile of plan.missingFiles) {
    lines.push('  ' + missingFile);
  }
  lines.push('');

  let changedValueCount = 0;
  for (const databaseValue of databaseValues) {
    const newValue = replacePathsInValue(databaseValue.value, databaseValue.pathColumn.format, plan.newPathFor);
    if (newValue !== databaseValue.value) {
      changedValueCount = changedValueCount + 1;
    }
  }
  lines.push('Database values to update: ' + changedValueCount);

  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  const reportPath = path.join(BACKUPS_DIR, 'reorganize-report-' + timestamp + '.txt');
  fs.writeFileSync(reportPath, lines.join('\n') + '\n');
  return reportPath;
}

// ---------------------------------------------------------------------------
// 4. Execute
// ---------------------------------------------------------------------------

function writeRestoreFile(databaseValues: DatabaseValue[], timestamp: string): string {
  const statements: string[] = [];
  statements.push('-- Restores every upload path to its value before reorganize-uploads ran.');
  statements.push('-- Files must also be moved back (or restored from backend/public/uploads).');

  for (const databaseValue of databaseValues) {
    const pathColumn = databaseValue.pathColumn;
    statements.push(
      mysql.format('UPDATE ?? SET ?? = ? WHERE ?? = ?;', [
        pathColumn.table,
        pathColumn.column,
        databaseValue.value,
        pathColumn.primaryKey,
        databaseValue.primaryKeyValue,
      ])
    );
  }

  const restorePath = path.join(BACKUPS_DIR, 'before-reorganize-' + timestamp + '.sql');
  fs.writeFileSync(restorePath, statements.join('\n') + '\n');
  return restorePath;
}

function moveFile(fromDiskPath: string, toDiskPath: string): void {
  fs.mkdirSync(path.dirname(toDiskPath), { recursive: true });

  // On Windows "Park Hyatt.jpg" -> "park-hyatt.jpg" in the same folder can clash
  // with itself, so move through a temporary name first.
  const temporaryPath = toDiskPath + '.moving';
  fs.renameSync(fromDiskPath, temporaryPath);
  fs.renameSync(temporaryPath, toDiskPath);
}

async function execute(plan: Plan, databaseValues: DatabaseValue[], timestamp: string) {
  const restorePath = writeRestoreFile(databaseValues, timestamp);
  console.log('Restore file written: ' + path.relative(REPOSITORY_ROOT, restorePath));

  // Move the files
  let movedCount = 0;
  for (const [oldPath, newPath] of plan.newPathFor) {
    if (oldPath === newPath) {
      continue;
    }
    moveFile(diskPathFor(oldPath), diskPathFor(newPath));
    movedCount = movedCount + 1;
  }
  console.log('Files moved: ' + movedCount);

  // Update the database (all or nothing)
  const updatedCount = await withTransaction(async function (connection) {
    let count = 0;
    for (const databaseValue of databaseValues) {
      const pathColumn = databaseValue.pathColumn;
      const newValue = replacePathsInValue(databaseValue.value, pathColumn.format, plan.newPathFor);
      if (newValue === databaseValue.value) {
        continue;
      }
      await connection.query('UPDATE ?? SET ?? = ? WHERE ?? = ?', [
        pathColumn.table,
        pathColumn.column,
        newValue,
        pathColumn.primaryKey,
        databaseValue.primaryKeyValue,
      ]);
      count = count + 1;
    }
    return count;
  });
  console.log('Database values updated: ' + updatedCount);

  // Update the frontend code
  const frontendFiles = new Set(FRONTEND_REFERENCES.map(function (reference) {
    return reference.file;
  }));
  for (const frontendFile of frontendFiles) {
    const fullPath = path.join(REPOSITORY_ROOT, frontendFile);
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const reference of FRONTEND_REFERENCES) {
      if (reference.file !== frontendFile) {
        continue;
      }
      const newPath = plan.newPathFor.get(reference.oldPath);
      if (newPath !== undefined) {
        content = content.split("'" + reference.oldPath + "'").join("'" + newPath + "'");
      }
    }
    fs.writeFileSync(fullPath, content);
  }
  console.log('Frontend files updated: ' + frontendFiles.size);

  // Move unused files out of the public folder
  for (const unusedFile of plan.unusedFiles) {
    const relativePath = unusedFile.replace(/^\/uploads\//, '');
    moveFile(diskPathFor(unusedFile), path.join(UNUSED_DIR, relativePath));
  }
  console.log('Unused files moved to uploads-unused/: ' + plan.unusedFiles.length);

  removeEmptyFolders(UPLOADS_DIR);
}

/**
 * After executing: every path in the database must point to an existing file.
 */
async function verify(): Promise<number> {
  const databaseValues = await readDatabaseValues();
  let missingCount = 0;

  for (const databaseValue of databaseValues) {
    for (const uploadPath of pathsInValue(databaseValue.value, databaseValue.pathColumn.format)) {
      if (fs.existsSync(diskPathFor(uploadPath)) === false) {
        missingCount = missingCount + 1;
        console.log('  MISSING: ' + uploadPath + '  (' + databaseValue.pathColumn.table + '.' + databaseValue.pathColumn.column + ')');
      }
    }
  }

  for (const reference of FRONTEND_REFERENCES) {
    const content = fs.readFileSync(path.join(REPOSITORY_ROOT, reference.file), 'utf8');
    const pathsInFile = content.match(/\/uploads\/[^'"`]+/g);
    if (pathsInFile === null) {
      continue;
    }
    for (const uploadPath of pathsInFile) {
      if (fs.existsSync(diskPathFor(uploadPath)) === false) {
        missingCount = missingCount + 1;
        console.log('  MISSING: ' + uploadPath + '  (' + reference.file + ')');
      }
    }
  }

  return missingCount;
}

// ---------------------------------------------------------------------------

async function main() {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').substring(0, 19);

  try {
    const databaseValues = await readDatabaseValues();
    const plan = buildPlan(databaseValues);
    const reportPath = writeReport(plan, databaseValues, timestamp);

    console.log('Files to organize:  ' + plan.newPathFor.size);
    console.log('Unused files:       ' + plan.unusedFiles.length);
    console.log('Missing files:      ' + plan.missingFiles.length);
    console.log('Report: ' + path.relative(REPOSITORY_ROOT, reportPath));

    if (IS_EXECUTE === false) {
      console.log('\nDRY RUN: nothing was changed. Run with --execute to apply.');
      return;
    }

    await execute(plan, databaseValues, timestamp);

    const missingAfter = await verify();
    console.log('\nVerification: ' + missingAfter + ' missing file(s)');
    if (missingAfter > 0) {
      process.exitCode = 1;
    }
  } finally {
    await closeDatabase();
  }
}

main();
