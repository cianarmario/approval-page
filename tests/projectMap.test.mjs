import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { validateBoundaries } from '../src/features/map/boundaryData.ts'
import { LEGAZPI_CITY_BOUNDS } from '../src/features/map/cityBounds.ts'
import { barangayLabel } from '../src/features/map/labelGeometry.ts'
import { createLandMask } from '../src/features/map/landMask.ts'
import { BOGTONG_DEMO_COORDINATES, makeDemoState, migrateDemoProjectLocations } from '../src/data/demo.ts'
import { projectBarangay } from '../src/features/projects/services/projectBarangay.ts'
import { prepareProjectMapGeography } from '../src/features/projects/services/projectMapGeography.ts'

const barangays = JSON.parse(readFileSync(new URL('../public/data/legazpi/barangays.geojson', import.meta.url), 'utf8'))
const city = JSON.parse(readFileSync(new URL('../public/data/legazpi/city.geojson', import.meta.url), 'utf8'))

test('the reused map datasets contain one Legazpi city and all 70 unique barangays', () => {
  assert.equal(validateBoundaries(city, 'city').features.length, 1)
  assert.equal(validateBoundaries(barangays, 'barangays').features.length, 70)
  const incomplete = structuredClone(barangays)
  incomplete.features.pop()
  assert.throws(() => validateBoundaries(incomplete, 'barangays'), /incomplete/)
})

test('project barangays match current names and use the same labels as the user-side map', () => {
  const bogtong = projectBarangay('Bogtong', barangays.features)
  const bitano = projectBarangay('Bitano', barangays.features)
  assert.ok(bogtong)
  assert.ok(bitano)
  assert.match(barangayLabel(bogtong.properties.name), /^41.*Bogtong.*45/)
  assert.match(barangayLabel(bitano.properties.name), /^37.*Bitano/)
  assert.equal(projectBarangay('Unknown barangay', barangays.features), undefined)
})

test('the Bogtong project marker is inside the actual Bogtong boundary', () => {
  const project = makeDemoState().projects.find(project => project.id === 'LGP-2026-001')
  const boundary = projectBarangay(project.barangay, barangays.features)
  const mask = createLandMask([boundary])
  const [latitude, longitude] = project.coordinates
  assert.equal(mask([longitude, latitude]), true)
  assert.deepEqual(project.coordinates, BOGTONG_DEMO_COORDINATES)
})

test('saved sample locations are corrected without replacing review records or custom points', () => {
  const saved = makeDemoState()
  saved.projects[0].coordinates = [13.1674, 123.7273]
  saved.projects[0].milestones[0].remarks = 'Keep the saved inspection remarks.'
  const corrected = migrateDemoProjectLocations(saved)
  assert.deepEqual(corrected.projects[0].coordinates, BOGTONG_DEMO_COORDINATES)
  assert.deepEqual(saved.projects[0].coordinates, [13.1674, 123.7273])
  assert.equal(corrected.projects[0].milestones, saved.projects[0].milestones)
  assert.equal(corrected.projects[1], saved.projects[1])
  for (const key of ['invitations', 'emails', 'activity']) assert.equal(corrected[key], saved[key])
  assert.equal(migrateDemoProjectLocations(corrected), corrected)
  saved.projects[0].coordinates = [13.161, 123.732]
  assert.equal(migrateDemoProjectLocations(saved), saved)
})

test('the map navigation limits match the full city boundary extent', () => {
  const points = city.features.flatMap(feature => feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates.flat(1)
    : feature.geometry.coordinates.flat(2))
  const latitudes = points.map(point => point[1])
  const longitudes = points.map(point => point[0])
  assert.deepEqual(LEGAZPI_CITY_BOUNDS, [
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)],
  ])
})

test('geography preparation supplies outlines and valid label positions for every barangay', () => {
  const prepared = prepareProjectMapGeography(validateBoundaries(barangays, 'barangays'))
  assert.equal(Object.keys(prepared.labels).length, 70)
  assert.ok(prepared.outlines)
  for (const feature of barangays.features) {
    const label = prepared.labels[feature.properties.pcode]
    assert.ok(label)
    assert.equal(label.position.length, 2)
    assert.ok(label.position.every(Number.isFinite))
  }
})
