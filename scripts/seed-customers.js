require('dotenv/config')

const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in your .env file')
}

const adapter = new PrismaPg({
  connectionString,
})

const prisma = new PrismaClient({
  adapter,
})

const TOTAL_CUSTOMERS = 200
const PAGE_SIZE = 25

const firstNames = [
  'Aarav',
  'Aditya',
  'Arjun',
  'Aryan',
  'Dhruv',
  'Ishaan',
  'Kabir',
  'Karan',
  'Krishna',
  'Manav',
  'Rahul',
  'Rohan',
  'Rudra',
  'Sahil',
  'Samar',
  'Shrey',
  'Ved',
  'Vivaan',
  'Yash',
  'Abhishek',
  'Akshay',
  'Ananya',
  'Diya',
  'Isha',
  'Kavya',
  'Meera',
  'Neha',
  'Nisha',
  'Pooja',
  'Priya',
  'Riya',
  'Sakshi',
  'Shreya',
  'Sneha',
  'Tanvi',
  'Tanya',
  'Aditi',
  'Anika',
  'Avni',
  'Mahi',
]

const lastNames = [
  'Sharma',
  'Patil',
  'Joshi',
  'Deshmukh',
  'Kulkarni',
  'Gupta',
  'Mehta',
  'Shah',
  'Verma',
  'Singh',
  'Kapoor',
  'Malhotra',
  'Agarwal',
  'Jain',
  'Bansal',
  'Chopra',
  'Reddy',
  'Rao',
  'Nair',
  'Iyer',
  'Pawar',
  'Jadhav',
  'More',
  'Khan',
  'Mishra',
  'Pandey',
  'Saxena',
  'Sinha',
  'Thakur',
  'Chavan',
]

const cities = [
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Delhi',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Nashik',
  'Nagpur',
  'Surat',
  'Jaipur',
  'Indore',
  'Noida',
  'Thane',
  'Vadodara',
  'Kochi',
  'Lucknow',
  'Chandigarh',
  'Bhopal',
]

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function getTier(index) {
  // Roughly:
  // 60% BRONZE
  // 30% SILVER
  // 10% GOLD

  const percentage = index % 10

  if (percentage < 6) {
    return 'BRONZE'
  }

  if (percentage < 9) {
    return 'SILVER'
  }

  return 'GOLD'
}

function createCustomer(index, passwordHash) {
  const firstName = randomItem(firstNames)
  const lastName = randomItem(lastNames)
  const city = randomItem(cities)

  const number = String(index + 1).padStart(3, '0')

  return {
    name: `${firstName} ${lastName}`,
    email: `customer${number}@dealflow.demo`,
    passwordHash,
    phone: `9${String(100000000 + index).slice(0, 9)}`,
    tier: getTier(index),
    isActive: true,
  }
}

async function seedCustomers() {
  console.log('🚀 Starting customer seed...')
  console.log(`📦 Total customers: ${TOTAL_CUSTOMERS}`)
  console.log(`📄 Batch size: ${PAGE_SIZE}`)
  console.log('')

  // Same password for every demo customer.
  // Customer login password:
  // Customer@123
  const passwordHash = await bcrypt.hash('Customer@123', 10)

  let created = 0
  let skipped = 0

  for (let page = 0; page < Math.ceil(TOTAL_CUSTOMERS / PAGE_SIZE); page++) {
    const startIndex = page * PAGE_SIZE
    const endIndex = Math.min(
      startIndex + PAGE_SIZE,
      TOTAL_CUSTOMERS
    )

    const pageCustomers = []

    for (let i = startIndex; i < endIndex; i++) {
      pageCustomers.push(createCustomer(i, passwordHash))
    }

    console.log(
      `📄 Batch ${page + 1}: customers ${startIndex + 1}-${endIndex}`
    )

    const result = await prisma.customer.createMany({
      data: pageCustomers,
      skipDuplicates: true,
    })

    created += result.count
    skipped += pageCustomers.length - result.count

    console.log(`   ✅ Created: ${result.count}`)
    console.log('')
  }

  console.log('--------------------------------')
  console.log('🎉 Customer seed completed!')
  console.log(`✅ Created: ${created}`)
  console.log(`⏭️ Skipped: ${skipped}`)
  console.log(`👥 Requested: ${TOTAL_CUSTOMERS}`)
  console.log('--------------------------------')
  console.log('')
  console.log('Demo customer password: Customer@123')
}

seedCustomers()
  .catch((error) => {
    console.error('❌ Seed failed:')
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })