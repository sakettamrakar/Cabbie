import { useState } from 'react';
export interface Faq { q:string; a:string }
export interface FaqListProps { faqs:Faq[]; headingLevel?:number }
export function FaqList({ faqs, headingLevel=2 }:FaqListProps){
  const H = `h${headingLevel}` as any;
  const [open,setOpen]=useState<number|null>(0);
  if(!faqs?.length) return null;
  return (
    <section aria-labelledby="faqHeading">
      <H id="faqHeading">FAQs</H>
      <dl>
        {faqs.map((f,i)=>{
          const expanded = open===i;
          const panelId = `faq-panel-${i}`;
          const btnId = `faq-btn-${i}`;
          return (
            <>
              <dt key={`dt-${i}`} style={{marginTop: i? 8:0}}>
                <button
                  id={btnId}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={()=>setOpen(expanded? null : i)}
                  style={{
                    width:'100%',
                    textAlign:'left',
                    background:'#0a7b83',
                    color:'#fff',
                    border:'2px solid #055',
                    padding:'10px 14px',
                    borderRadius:6,
                    fontWeight:600,
                    cursor:'pointer'
                  }}>
                  <span>{f.q}</span>
                  <span style={{float:'right'}}>{expanded?'−':'+'}</span>
                </button>
              </dt>
              <dd key={`dd-${i}`}
                id={panelId}
                aria-labelledby={btnId}
                hidden={!expanded}
                style={{margin:'6px 0 0 0',padding: expanded? '8px 10px':'0',background:'#f1f5f9',borderRadius:4,fontSize:14}}
                aria-live="polite"
              >{expanded && <div>{f.a}</div>}</dd>
            </>
          );
        })}
      </dl>
    </section>
  );
}
export default FaqList;
