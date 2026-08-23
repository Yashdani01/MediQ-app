import React from 'react';

export default function PhysioGuideModal({ onClose }) {
  const physioData = [
    {
      title: '1. Stroke & Cerebrovascular Accidents (CVA)',
      context: 'Interruption of cerebral blood flow leads to contralateral hemiplegia, loss of motor control, and spasticity.',
      physio: 'Neuro-rehabilitation, task-specific motor relearning, constraint-induced movement therapy (CIMT), and dynamic balance re-education.',
      yoga: 'Sukhasana (Easy Pose) with diaphragmatic breathing and gentle seated torso twists to reduce trunk spasticity.'
    },
    {
      title: '2. Acute Myocardial Infarction & Cardiac Surgeries (CABG)',
      context: 'Post-infarction or post-operative recovery requires controlled restoration of cardiovascular endurance.',
      physio: 'Phase 1 & Phase 2 Cardiac Rehab, telemetry-monitored aerobic conditioning, and incentive spirometry.',
      yoga: 'Shavasana (Corpse Pose) with slow abdominal breathing to lower heart rate; seated chest openers for sternal recovery.'
    },
    {
      title: '3. Chronic Obstructive Pulmonary Disease (COPD)',
      context: 'Progressive airflow obstruction and lung hyperinflation leading to chronic breathlessness.',
      physio: 'Pursed-lip breathing, diaphragmatic training, postural drainage, and chest clearance techniques.',
      yoga: 'Matsyasana (Fish Pose) with upper-back support to expand thoracic capacity; Anulom Vilom pranayama.'
    },
    {
      title: '4. Parkinson’s Disease & Neurodegenerative Disorders',
      context: 'Dopaminergic depletion resulting in akinesia, rigidity, postural instability, and freezing of gait.',
      physio: 'Rhythmic auditory cueing to break freezing episodes, LSVT BIG amplitude training, and balance perturbation drills.',
      yoga: 'Seated cat-cow stretches (Marjaryasana-Bitilasana) to loosen rigid thoracic vertebrae.'
    },
    {
      title: '5. Lumbar Herniated Disc & Severe Sciatica',
      context: 'Mechanical compression or chemical irritation of lumbar nerve roots causing radiating lower limb pain.',
      physio: 'McKenzie method directional preference extension exercises, manual spinal traction, and core stabilization.',
      yoga: 'Bhujangasana (Cobra Pose - progressive low range) and Setu Bandhasana (Bridge Pose).'
    },
    {
      title: '6. Post-Operative Joint Arthroplasty (Knee/Hip Replacement)',
      context: 'Surgical trauma and immobilization leading to quadriceps inhibition, joint stiffness, and scar tissue adhesion.',
      physio: 'Continuous passive motion (CPM), early active mobilization, terminal knee extensions, and closed-chain weight bearing.',
      yoga: 'Supine gentle ankle pumps and seated leg extensions to lubricate joint capsules and stimulate synovial fluid.'
    },
    {
      title: '7. Spinal Cord Injury (SCI) & Trauma',
      context: 'Structural damage to the spinal cord causing varying degrees of motor, sensory, and autonomic impairment.',
      physio: 'Contracture prevention stretching regimes, functional electrical stimulation (FES), and upper limb strengthening.',
      yoga: 'Assisted passive stretching protocols, upper body restorative postures, and mindfulness for chronic pain.'
    },
    {
      title: '8. Severe Osteoarthritis & Advanced Joint Degeneration',
      context: 'Progressive articular cartilage breakdown, bone friction, joint effusion, and muscle weakness.',
      physio: 'Low-impact closed-chain strengthening (VMO muscle focus), Grade III-IV manual therapy joint mobilizations, hydrotherapy.',
      yoga: 'Non-weight-bearing joint rotations (ankle, knee, hip circles) and modified Vajrasana.'
    },
    {
      title: '9. Post-ICU Acquired Weakness (ICUAW)',
      context: 'Prolonged bed rest and systemic inflammation in ICU resulting in severe generalized atrophy.',
      physio: 'Graded progressive mobilization from bed to standing, neuromuscular electrical stimulation (NMES), and ADL retraining.',
      yoga: 'Bed-based restorative stretching, gentle joint opening movements, and rhythmic breathing.'
    },
    {
      title: '10. Multi-Ligament Knee Injuries (ACL / PCL Tears)',
      context: 'Traumatic rupture of primary knee stabilizers resulting in joint laxity and instability episodes.',
      physio: 'Pre-surgical pre-hab conditioning, post-surgical progressive loading, and neuromuscular agility/plyometric drills.',
      yoga: 'Balasana (Child’s Pose with bolster support) for knee flexion recovery and Tadasana balance sequences.'
    }
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(6, 43, 37, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--white)', width: '100%', maxWidth: '650px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' }}>
        
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--sand-100)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ink)' }}
        >
          ✕
        </button>

        <h3 style={{ margin: '0 0 4px', fontFamily: 'Fraunces, serif', fontSize: '20px', color: 'var(--teal-900)' }}>Physiotherapy & Therapeutic Yoga</h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--ink-soft)' }}>Detailed clinical protocols and movement therapies for 10 critical chronic conditions.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {physioData.map((item, idx) => (
            <div key={idx} style={{ background: 'var(--sand-50)', padding: '14px', borderRadius: '14px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--teal-900)' }}>{item.title}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink-soft)', fontStyle: 'italic' }}><strong>Context:</strong> {item.context}</div>
              <div style={{ fontSize: '12px', color: 'var(--ink)' }}><strong>Physiotherapy:</strong> {item.physio}</div>
              <div style={{ fontSize: '12px', color: 'var(--teal-700)' }}><strong>Therapeutic Yoga:</strong> {item.yoga}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
