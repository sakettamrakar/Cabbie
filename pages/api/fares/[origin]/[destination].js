import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function validateSlug(s){ return /^[a-z0-9-]{2,}$/.test(s); }

function applyOffer(base, offer, origin){
	if(!offer) return { final: base, applied:false, discount:0 };
	const now=new Date();
	if(offer.valid_from && now < offer.valid_from) return { final: base, applied:false, discount:0 };
	if(offer.valid_to && now > offer.valid_to) return { final: base, applied:false, discount:0 };
	if(offer.conditions){
		try {
			const cond=JSON.parse(offer.conditions);
			if(cond.city && cond.city!==origin) return { final: base, applied:false, discount:0 };
			if(cond.minFare && base < cond.minFare) return { final: base, applied:false, discount:0 };
		} catch {}
	}
	let discount=0;
	if(offer.discount_type==='FLAT') discount=offer.value;
	else if(offer.discount_type==='PCT') discount=Math.round(base * (offer.value/100));
	if(offer.cap_inr && discount>offer.cap_inr) discount=offer.cap_inr;
	const final=Math.max(0, base-discount);
	return { final, applied: discount>0, discount };
}

export default async function handler(req,res){
	const { origin, destination, offer: offerCode } = req.query;
	const oSlug = String(origin||'').toLowerCase();
	const dSlug = String(destination||'').toLowerCase();
	if(!validateSlug(oSlug) || !validateSlug(dSlug)) return res.status(400).json({ error:'invalid_parameters' });
	try {
		const o = await prisma.city.findUnique({ where:{ slug:oSlug } });
		const d = await prisma.city.findUnique({ where:{ slug:dSlug } });
		if(!o || !d) return res.status(404).json({ error:'not_found' });
		const route = await prisma.route.findFirst({ where:{ origin_city_id:o.id, destination_city_id:d.id }, include:{ fares:true } });
		if(!route) return res.status(404).json({ error:'not_found' });
		if(route.is_active === false) return res.status(410).json({ error:'route_deprecated' });
		let offer=null;
		if(offerCode){ offer = await prisma.offer.findUnique({ where:{ code:String(offerCode).toUpperCase() } }); }
		const fares = route.fares
			.sort((a,b)=> a.base_fare_inr - b.base_fare_inr)
			.map(f=>{
				const calc = applyOffer(f.base_fare_inr, offer, o.slug);
				return {
					car_type: f.car_type,
						base_fare_inr: f.base_fare_inr,
						final_fare_inr: calc.final,
						discount_inr: calc.discount,
						offer_applied: calc.applied
				};
			});
		const shapedRoute = {
			id: route.id,
			origin: { slug:o.slug, name:o.name },
			destination: { slug:d.slug, name:d.name },
			distance_km: route.distance_km,
			duration_min: route.duration_min
		};
		return res.status(200).json({ route: shapedRoute, fares });
	} catch(e){
		console.error(e); return res.status(500).json({ error:'server_error' });
	}
}