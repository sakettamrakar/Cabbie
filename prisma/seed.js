/* Idempotent seeders */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function upsertCity(data){return prisma.city.upsert({where:{slug:data.slug},update:data,create:data});}
async function upsertRouteBySlugs(oSlug,dSlug,data={}){const o=await prisma.city.findUnique({where:{slug:oSlug}});const d=await prisma.city.findUnique({where:{slug:dSlug}});if(!o||!d) throw new Error('Missing city '+oSlug+' -> '+dSlug);const ex=await prisma.route.findFirst({where:{origin_city_id:o.id,destination_city_id:d.id}});if(ex) return ex;return prisma.route.create({data:{origin_city_id:o.id,destination_city_id:d.id,is_airport_route:data.is_airport_route??false,distance_km:data.distance_km??null,duration_min:data.duration_min??null}});} 
async function ensureFares(routeId,fares){for(const f of fares){const {car_type,base_fare_inr,night_surcharge_pct=0}=f;const ex=await prisma.fare.findFirst({where:{route_id:routeId,car_type}});if(ex){await prisma.fare.update({where:{id:ex.id},data:{base_fare_inr,night_surcharge_pct}});}else{await prisma.fare.create({data:{route_id:routeId,car_type,base_fare_inr,night_surcharge_pct}});}}}
async function ensureContentToken(key,payload){await prisma.contentToken.upsert({where:{key},update:{json:payload,updatedAt:new Date()},create:{key,json:payload}});} 
async function main(){
	// 10 Cities
	const cityDefs=[
		{name:'Raipur',slug:'raipur',state:'Chhattisgarh',airport_code:'RPR'},
		{name:'Bilaspur',slug:'bilaspur',state:'Chhattisgarh'},
		{name:'Bhilai',slug:'bhilai',state:'Chhattisgarh'},
		{name:'Durg',slug:'durg',state:'Chhattisgarh'},
		{name:'Rajnandgaon',slug:'rajnandgaon',state:'Chhattisgarh'},
		{name:'Raigarh',slug:'raigarh',state:'Chhattisgarh'},
		{name:'Korba',slug:'korba',state:'Chhattisgarh'},
		{name:'Jagdalpur',slug:'jagdalpur',state:'Chhattisgarh'},
		{name:'Nagpur',slug:'nagpur',state:'Maharashtra',airport_code:'NAG'},
		{name:'Vizag',slug:'vizag',state:'Andhra Pradesh',airport_code:'VTZ'}
	];
	for(const c of cityDefs) await upsertCity(c);

	// 10 Routes with distance/duration
	const routeDefs=[
		['raipur','bilaspur',120,150],
		['bilaspur','raipur',120,150],
		['raipur','bhilai',35,60],
		['raipur','durg',40,70],
		['raipur','rajnandgaon',75,120],
		['raipur','raigarh',250,300],
		['raipur','korba',200,240],
		['raipur','jagdalpur',280,420],
		['raipur','nagpur',290,360],
		['raipur','vizag',530,660]
	];
	const routeMap={};
	for(const [o,d,dist,dur] of routeDefs){
		const r=await upsertRouteBySlugs(o,d,{distance_km:dist,duration_min:dur});
		routeMap[`${o}:${d}`]=r;
	}

	// Fare formula: hatch = dist*12 + 100; sedan +200; suv +600
	function fareSet(distance){
		const hatch = Math.round(distance*12 + 100);
		return [
			{car_type:'HATCHBACK',base_fare_inr:hatch},
			{car_type:'SEDAN',base_fare_inr:hatch+200},
			{car_type:'SUV',base_fare_inr:hatch+600}
		];
	}
	for(const [o,d,dist] of routeDefs){
		const r=routeMap[`${o}:${d}`];
		await ensureFares(r.id,fareSet(dist));
	}

	// Offers new structure (FLAT / PCT)
	const offerDefs=[
		{ code:'WELCOME100', title:'Welcome 100', description:'₹100 flat off fares over 1000', discount_type:'FLAT', value:100, cap_inr:null, conditions:JSON.stringify({minFare:1000}), valid_from:new Date('2025-01-01'), valid_to:new Date('2025-12-31') },
		{ code:'RAIPUR20', title:'Raipur 20% OFF', description:'20% off Raipur-origin routes (cap 500)', discount_type:'PCT', value:20, cap_inr:500, conditions:JSON.stringify({city:'raipur'}), valid_from:new Date('2025-06-01'), valid_to:new Date('2025-08-31') }
	];
	for(const o of offerDefs){
		await prisma.offer.upsert({ where:{ code:o.code }, update:o, create:o });
	}

	// Drivers
	const driverDefs=[
		{ phone:'+911111000001', name:'Arjun Verma', car_type:'SEDAN' },
		{ phone:'+911111000002', name:'Ravi Kumar', car_type:'HATCHBACK' },
		{ phone:'+911111000003', name:'Suman Patel', car_type:'SUV' },
		{ phone:'+911111000004', name:'Neha Singh', car_type:'SEDAN' }
	];
	for(const d of driverDefs){ await prisma.driver.upsert({ where:{ phone:d.phone }, update:d, create:d }); }

	// Content tokens per route (highlights + faqs)
		function key(o,d,type){ return `${type}:${o}-${d}`; }
		const specialContent={
			'raipur:bilaspur':{
				highlights:["Toll & GST included in fare","Doorstep pickup in Raipur","No hidden charges","Professional drivers"],
				faqs:[
					{q:'Is toll included in the fare?',a:'Yes, all tolls and GST are included.'},
					{q:'Do you charge for luggage?',a:'No, standard luggage is free.'},
					{q:'Is there a night surcharge?',a:'Yes, 20% surcharge applies between 10 PM and 5 AM.'},
					{q:'Can I cancel my booking?',a:'Free cancellation up to 2 hours before pickup.'},
					{q:'Will the driver call me before pickup?',a:'Yes, about 30 minutes before pickup.'}
				]
			},
			'raipur:nagpur':{
				highlights:["One-way cab service from Raipur to Nagpur","Flat all-inclusive fares","Air-conditioned sedans & SUVs available","Experienced intercity drivers"],
				faqs:[
					{q:'How long does it take from Raipur to Nagpur?',a:'Approx. 6 hours under normal traffic.'},
					{q:'Can I get a receipt for business travel?',a:'Yes, receipts are provided after completion.'},
					{q:'Is fuel cost included?',a:'Yes, fares are all-inclusive of fuel, toll, and taxes.'},
					{q:'Do you offer round trip bookings?',a:'Currently, one-way fares only in MVP.'}
				]
			}
		};
		for(const [o,d,dist] of routeDefs){
			const keyBase=`${o}:${d}`;
			const hc = specialContent[keyBase]?.highlights || ["Clean AC cars","Professional drivers","Transparent one-way pricing","Instant booking confirmation"];
			const faqs = specialContent[keyBase]?.faqs || [
				{q:`What is the distance of the ${o} to ${d} route?`,a:`Approx. ${dist} km.`},
				{q:'Are tolls included?',a:'Yes, tolls & taxes included unless noted.'},
				{q:'Night surcharge timing?',a:'Applies 10 PM – 5 AM (20%).'},
				{q:'Can I cancel?',a:'Free cancellation up to 2 hours before pickup.'}
			];
			await ensureContentToken(key(o,d,'highlights'),JSON.stringify({highlights:hc}));
			await ensureContentToken(key(o,d,'faqs'),JSON.stringify({faqs}));
		}

	// Sample booking(s) only if empty (new schema fields)
	if(await prisma.booking.count()===0){
		const rRb=routeMap['raipur:bilaspur'];
		const sedanFare=await prisma.fare.findFirst({where:{route_id:rRb.id,car_type:'SEDAN'}});
		if(sedanFare){
			await prisma.booking.create({data:{
				route_id:rRb.id,
				origin_text:'Raipur City Center',
				destination_text:'Bilaspur Station',
				pickup_datetime:new Date(Date.now()+3600_000),
				car_type:'SEDAN',
				fare_quote_inr:sedanFare.base_fare_inr,
				payment_mode:'COD',
				status:'PENDING',
				customer_name:'Sample User',
				customer_phone:'+919999888800',
				discount_code:'WELCOME100'
			}});
		}
	}

	console.log('✅ Seed complete (10 cities, 10 routes, fares, offers, drivers, content tokens, sample booking)');
	// Admin user (default) if none exists
	const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
	const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
	const bcrypt = require('bcryptjs');
	const existingAdmin = await prisma.user.findUnique({ where:{ email:adminEmail } }).catch(()=>null);
	if(!existingAdmin){
		const hash = await bcrypt.hash(adminPass, 10);
		await prisma.user.create({ data:{ email:adminEmail, passwordHash:hash } });
		console.log('Created admin user:', adminEmail);
	}
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(async()=>{await prisma.$disconnect();});