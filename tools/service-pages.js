/**
 * Content for the individual service pages.
 *
 * Ten services shared one URL, so one page was competing for ten different
 * searches and could only ever rank strongly for one of them. Each service now
 * has its own page, its own title, and its own structured data.
 *
 * Two kinds of statement are mixed here and they are not equally safe:
 *
 *   Process facts  - what annealing does, why tempering follows hardening.
 *                    Standard metallurgy, true of anyone who does the work.
 *   Capability     - furnace sizes, the 30,000 litre quench, the 40 tonne UTM,
 *                    the Ø700 x 1500 induction machine. All from the company
 *                    profile, so they are Met-Test's own figures.
 *
 * Nothing here claims an approval, accreditation or customer that the company
 * has not already published.
 */
module.exports = {
  address: 'Plot No. C-1-10, Road No. B-10, GIDC Estate, Vitthal Udyognagar, Anand, Gujarat 388121',
  phone: '+91 98253 21695',
  email: 'mettestlab@yahoo.com',

  services: [
    {
      slug: 'induction-hardening',
      name: 'Induction Hardening',
      video: 'hiBrKOCMA8E',
      title: 'Induction Hardening in Anand, Gujarat | Met-Test Laboratories',
      desc: 'Induction hardening for shafts, gears and journals up to Ø700 × 1500 mm, on coils designed and built in-house. Vitthal Udyognagar, Anand, Gujarat.',
      lede: 'Induction hardening puts hardness exactly where a component wears, and nowhere else. An alternating current in a shaped copper coil induces eddy currents in the surface of the part, heating it to austenitising temperature in seconds while the core stays comparatively cool. Quench immediately and that surface transforms to martensite; the core keeps the toughness it started with.',
      sections: [
        { h: 'Where it earns its place', p: 'Anything that has to resist wear on one face while absorbing shock through its body. Bearing journals on shafts, individual gear teeth, cam lobes, splines, track rollers, pins and rolls. A through-hardened shaft is hard everywhere and brittle everywhere; an induction hardened one has a hard running surface and a core that will bend before it snaps.' },
        { h: 'It stands or falls on the coil', p: 'The coil is what shapes the heat, so it has to match the part profile. This is why our inductors are designed and fabricated in-house rather than bought in, including flux concentrators for geometries an off-the-shelf coil cannot follow. Matching the coil to the work is what lets us hold case depth to tolerance on shapes that would otherwise heat unevenly.', link: { href: 'inductor-manufacturing', text: 'How we build the coils' } },
        { h: 'Distortion and what to expect', p: 'Because only the surface reaches temperature, induction hardening moves a part far less than a furnace cycle. It is often the right answer for a finished or near-finished component where a through-hardening route would need straightening or regrinding afterwards. Tell us the finished tolerance at enquiry and the cycle is planned around it.' },
      ],
      capacity: [
        ['Maximum part size', 'Ø700 × 1500 mm long'],
        ['Coils', 'Designed and fabricated in-house'],
        ['Typical work', 'Shafts, gears, journals, splines, rolls'],
      ],
      faq: [
        ['What case depth can you achieve?', 'Case depth is set by the power, frequency and dwell chosen for the part, and by the material. Send the drawing and the specified depth and we will confirm it is achievable before the job is booked.'],
        ['Which steels suit induction hardening?', 'Medium-carbon steels, typically 0.40 to 0.60 percent carbon, and the common alloy grades such as EN8, EN19 and EN24. Low-carbon steels will not harden usefully by this route.'],
        ['Do you make the coil for my part?', 'Yes. Coils are designed and built in-house for the part profile, which is what makes consistent case depth on awkward shapes possible.'],
      ],
    },

    {
      slug: 'inductor-manufacturing',
      name: 'Inductor Manufacturing',
      video: '8Q866pljnzY',
      title: 'Custom Induction Coil Manufacturing | Met-Test Laboratories',
      desc: 'Custom induction coils and inductors designed and fabricated in-house, including flux concentrators for complex geometries. Anand, Gujarat.',
      lede: 'An induction coil is not a generic part. It is the tool that decides where the heat goes, how deep it reaches and how evenly it spreads around a component, and a coil that nearly fits produces a case that nearly meets the drawing. We design and build inductors in-house, for our own hardening work and for customers running their own machines.',
      sections: [
        { h: 'Why the coil is the whole job', p: 'Induction heating follows the coil. Where the coupling gap is wider the surface runs cooler, where it narrows it runs hotter, and on anything other than a plain cylinder that difference is what decides whether case depth holds around the full profile. Getting it right is a matter of shaping the coil to the part rather than compromising the part to a coil that already exists.' },
        { h: 'Flux concentrators', p: 'On gear teeth, splines and internal bores, the field needs steering rather than simply applying. Flux concentrators pull the field into the region that has to harden and keep it out of regions that must not, which is what makes single-tooth and contour hardening practical on geometries a plain encircling coil would heat indiscriminately.' },
        { h: 'Built to your specification', p: 'Coils are brazed from material of your choice to the profile the work requires. If you run your own induction equipment and need a coil built or replaced, send the part drawing and the machine details and we will quote against them.', link: { href: 'induction-hardening', text: 'See the hardening these coils do' } },
      ],
      capacity: [
        ['Construction', 'Brazed, material to your specification'],
        ['Flux concentrators', 'Fitted where the profile requires'],
        ['Supply', 'For our own machines or yours'],
      ],
      faq: [
        ['Can you build a coil for equipment we already own?', 'Yes. Send the component drawing along with your machine make, frequency and power rating, and the coil is designed against those.'],
        ['How long does a new inductor take?', 'It depends on the profile and on whether concentrators are needed. Send the drawing and we will give a lead time with the quote.'],
        ['Can you copy an existing coil that has worn out?', 'Usually. A worn coil plus the part it was built for is generally enough to work from.'],
      ],
    },

    {
      slug: 'hardening-and-tempering',
      name: 'Hardening & Tempering',
      video: 'xHPPn_RnVMQ',
      title: 'Hardening & Tempering Services in Anand | Met-Test Laboratories',
      desc: 'Through hardening and tempering in oil, on components up to six metres long. 30,000 litre quench tank, Vitthal Udyognagar, Anand, Gujarat.',
      lede: 'Hardening and tempering are a pair, and running one without the other is how components fail. Heating above the critical temperature and quenching transforms the structure to martensite, which is hard and wear-resistant and also brittle enough to crack under shock. Tempering afterwards brings the toughness back, trading a controlled amount of hardness for the ability to survive service.',
      sections: [
        { h: 'The two halves of the cycle', p: 'Hardening sets the maximum the material can reach. Tempering decides what you actually keep: a low tempering temperature holds most of the hardness for wear resistance, a higher one gives up hardness for impact strength. The tempering temperature is chosen against the hardness your drawing specifies, not against a house default.' },
        { h: 'Quenching', p: 'Quench severity governs both the hardness achieved and the risk of cracking and distortion. Our oil quench tank holds 30,000 litres, which matters because a large charge dropped into a small tank raises the oil temperature and quenches the last part differently from the first. Volume is what keeps a batch consistent from end to end.' },
        { h: 'Size is rarely the constraint', p: 'The gas-fired box furnaces take work up to six metres long, and the pit furnaces take a metre and a half of vertical section, so long shafts and large rings are handled without splitting the batch. Overhead cranes rated at five tonnes serve the floor.', link: { href: 'services#svc-heat-treatment', text: 'The full furnace list' } },
      ],
      capacity: [
        ['Largest component', '6000 × 2500 × 2000 mm'],
        ['Deepest section', 'Ø1300 × 1500 mm deep'],
        ['Quench', '30,000 litre oil tank'],
        ['Maximum temperature', '1200 °C'],
      ],
      faq: [
        ['What hardness can you hold?', 'The achievable range depends on the grade and section. Give us the specified hardness and the material and the cycle is set against it, then verified on the treated part before dispatch.'],
        ['Will my part distort?', 'Any through-hardening cycle moves material to some degree. Fixturing and load orientation are planned to control it, and telling us the critical dimensions at enquiry is what lets that planning happen.'],
        ['Do you supply a hardness report?', 'Yes. Every batch leaves with a QA report and certificate of conformity tied to its job card.'],
      ],
    },

    {
      slug: 'annealing',
      name: 'Annealing',
      video: '2CcZXtytf0k',
      title: 'Annealing Services in Anand, Gujarat | Met-Test Laboratories',
      desc: 'Full annealing to soften material, relieve stress and restore ductility before machining or forming. Anand, Gujarat, on parts up to six metres.',
      lede: 'Annealing is the step that makes the next operation possible. Heating above the critical temperature and cooling slowly softens the material, releases internal stress and restores ductility that cold work or an earlier heat treatment has used up. It is usually not the finish; it is what lets the part be machined, formed or treated properly afterwards.',
      sections: [
        { h: 'When a part needs it', p: 'After cold drawing, rolling or heavy forming, when the material has work-hardened to the point where further deformation will crack it. Before machining, when a hard or uneven structure would destroy tooling or refuse to hold a finish. And after welding or a previous treatment has left a structure that will not behave predictably.' },
        { h: 'Slow cooling is the point', p: 'The distinction between annealing and normalising is the cooling rate. Annealing cools slowly, usually in the furnace, which produces the softest and most ductile result. Normalising cools in still air and gives a finer, slightly harder structure. If you are unsure which the drawing intends, send it and we will read it with you.', link: { href: 'normalising', text: 'How normalising differs' } },
        { h: 'Capacity', p: 'Annealing runs across both furnace types, so batch size is rarely the limiting factor. Long sections go into the six-metre gas-fired boxes; deep or awkward work goes into the electric pit furnaces, which take a metre and a half of vertical section.' },
      ],
      capacity: [
        ['Largest component', '6000 × 2500 × 2000 mm'],
        ['Deepest section', 'Ø1300 × 1500 mm deep'],
        ['Maximum temperature', '1200 °C'],
        ['Furnaces available', '15 across five configurations'],
      ],
      faq: [
        ['What is the difference between annealing and stress relieving?', 'Annealing goes above the critical temperature and changes the structure, softening the material. Stress relieving stays below it and releases locked-in stress without softening the part.'],
        ['How long does an annealing cycle take?', 'Slow cooling makes it one of the longer cycles, typically the better part of a working day for a standard charge. We confirm turnaround at the point of enquiry.'],
        ['Can you anneal after we have welded?', 'Yes, and it is a common reason for sending work. Welding leaves both a hardened heat-affected zone and residual stress; annealing addresses the structure, stress relieving addresses the stress alone.'],
      ],
    },

    {
      slug: 'normalising',
      name: 'Normalising',
      video: 'W5LeJnGeNYk',
      title: 'Normalising Services in Anand, Gujarat | Met-Test Laboratories',
      desc: 'Normalising to refine and even out grain structure in castings, forgings and weldments. Anand, Gujarat, on components up to six metres long.',
      lede: 'Normalising heats the material above its critical temperature and then cools it in still air. The result is a finer, more uniform grain than the part arrived with, which is what makes everything after it more predictable: machining, further heat treatment and the way the component behaves in service.',
      sections: [
        { h: 'What it corrects', p: 'Castings solidify with coarse and uneven grain. Forgings carry the structure their working left behind. Welds leave a heat-affected zone with quite different properties from the parent metal a few millimetres away. Normalising resets all three toward something uniform, so the part responds consistently to whatever comes next.' },
        { h: 'Normalising or annealing', p: 'Both go above critical temperature; the difference is how they come down. Air cooling leaves normalised material harder and stronger than annealed material, with finer grain, but less soft and less ductile. Where a drawing calls for machinability above all, annealing is usually intended. Where it calls for uniform structure and strength, normalising is.', link: { href: 'annealing', text: 'How annealing differs' } },
        { h: 'Often a preparation step', p: 'Normalising is frequently specified before hardening and tempering, so the hardening cycle starts from an even structure and delivers an even result. Where that is the intent, both operations can be run here on the same job card.', link: { href: 'hardening-and-tempering', text: 'Hardening and tempering' } },
      ],
      capacity: [
        ['Largest component', '6000 × 2500 × 2000 mm'],
        ['Deepest section', 'Ø1300 × 1500 mm deep'],
        ['Maximum temperature', '1200 °C'],
        ['Cooling', 'Still air'],
      ],
      faq: [
        ['Is normalising needed before hardening?', 'Not always, but it is often specified for castings, forgings and weldments so that the hardening cycle starts from a uniform structure.'],
        ['Will normalising soften my part?', 'It will usually soften a hardened part and may harden a coarse annealed one. It moves the material toward a uniform mid-range condition rather than in one direction.'],
        ['Can you normalise large fabrications?', 'Yes. The gas-fired box furnaces take work up to six metres long.'],
      ],
    },

    {
      slug: 'stress-relieving',
      name: 'Stress Relieving',
      video: 'RbQAtJ0PGrE',
      title: 'Stress Relieving Services in Anand | Met-Test Laboratories',
      desc: 'Stress relieving for welded, machined and cast components, below the critical temperature so hardness is retained. Anand, Gujarat.',
      lede: 'Welding, machining and casting all lock stress inside a component, and stress that is never released will find its own way out later, as distortion on the machine bed or a crack in service. Stress relieving heats the part below its critical temperature and holds it there long enough for that stress to relax, without changing the structure or giving up hardness.',
      sections: [
        { h: 'Why below critical temperature', p: 'That is the whole point of the process. Staying below the critical temperature means the microstructure is left alone: a hardened part stays hard, a normalised part keeps its grain. Only the internal stress relaxes. If a cycle went above critical it would be annealing or normalising, and the part would come back with different properties than it went in with.' },
        { h: 'When it is worth doing', p: 'After welding, particularly on heavy fabrications and anything that will be machined to close tolerance afterwards. After rough machining, before the finishing cuts, so the part moves in the furnace rather than on the machine. And on castings that will be line-bored or ground, where stress released later shows up as a dimension that has drifted.' },
        { h: 'Capacity', p: 'Fabrications up to six metres go into the gas-fired box furnaces. Because stress relieving runs cooler than a hardening cycle, it is often the least disruptive operation to add to a job already booked in for something else.', link: { href: 'services', text: 'All heat treatment services' } },
      ],
      capacity: [
        ['Largest component', '6000 × 2500 × 2000 mm'],
        ['Deepest section', 'Ø1300 × 1500 mm deep'],
        ['Structure', 'Unchanged; hardness retained'],
      ],
      faq: [
        ['Will stress relieving soften my hardened part?', 'No, provided the stress relieving temperature stays below the tempering temperature the part already saw. Tell us the hardness that must be retained and the cycle is set beneath it.'],
        ['Should I stress relieve before or after machining?', 'Usually between roughing and finishing. That way the part does its moving in the furnace, and the finishing cuts bring it to the final dimension afterwards.'],
        ['Do you stress relieve weldments?', 'Yes, and it is one of the more common reasons work arrives here. Send the fabrication drawing with the weld detail.'],
      ],
    },

    {
      slug: 'solution-annealing',
      name: 'Solution Annealing',
      video: 'UGq1pXNFBU0',
      title: 'Solution Annealing for Stainless Steel | Met-Test Laboratories',
      desc: 'Solution annealing for stainless steels and superalloys — dissolving precipitates and quenching to restore corrosion resistance. Anand, Gujarat.',
      lede: 'Solution annealing is what returns a stainless steel or a superalloy to the condition it is supposed to be in. The part is heated until the precipitates that formed during welding or prior processing dissolve back into the matrix, then quenched quickly enough that they have no chance to re-form on the way down. What comes out has its corrosion resistance and ductility back.',
      sections: [
        { h: 'The problem it solves', p: 'When austenitic stainless steel sits in a certain temperature band, chromium carbides precipitate at the grain boundaries and take chromium out of the surrounding metal. Those chromium-depleted boundaries are where corrosion then attacks. Welding puts a band of exactly that temperature through the heat-affected zone, which is why welded stainless so often needs this treatment before it goes into service.' },
        { h: 'Speed on the way down', p: 'Dissolving the precipitates is only half of it. If the part cools slowly through the sensitising range they simply form again and nothing has been achieved. The quench has to be quick, which is what makes section thickness and load arrangement worth discussing before the job is booked rather than after.' },
        { h: 'What we need from you', p: 'The grade matters more here than in almost any other treatment: 304, 316, a duplex, a nickel alloy and a precipitation-hardening grade all want different temperatures and different handling. Send the material specification with the enquiry.', link: { href: 'material-testing', text: 'If the grade is uncertain, we can verify it' } },
      ],
      capacity: [
        ['Typical materials', 'Austenitic stainless, duplex, nickel alloys'],
        ['Largest component', '6000 × 2500 × 2000 mm'],
        ['Maximum temperature', '1200 °C'],
      ],
      faq: [
        ['Is solution annealing the same as annealing?', 'No. Ordinary annealing softens carbon and alloy steels by cooling slowly. Solution annealing dissolves precipitates in stainless and superalloys and then quenches fast, and slow cooling would defeat it entirely.'],
        ['Do welded stainless fabrications need it?', 'Often, yes. Welding sensitises the heat-affected zone, and where the part will meet a corrosive service environment, solution annealing restores the resistance that welding took away.'],
        ['Which grades do you handle?', 'The common austenitic grades and duplex and nickel alloys. Send the specification with the enquiry and we will confirm before booking.'],
      ],
    },

    {
      slug: 'flame-hardening',
      name: 'Flame Hardening',
      video: 'c3OJxWNrC18',
      title: 'Flame Hardening Services in Anand | Met-Test Laboratories',
      desc: 'Flame hardening for large gears, rings, tracks and slideways too big for a furnace or induction coil. Anand, Gujarat.',
      lede: 'Some components are simply too large, too heavy or too awkward to put in a furnace or inside an induction coil. Flame hardening takes the heat to the part instead: a controlled oxy-gas flame raises the working surface to austenitising temperature and a quench follows immediately behind it, hardening the face that takes the wear and leaving the rest of the component as it was.',
      sections: [
        { h: 'Where it is the only practical route', p: 'Large gear teeth on slow-turning drives, crane and travel wheels, ring gears, machine slideways and ways, track surfaces, and sprockets big enough that no coil would encircle them. It is also useful where only one region of a large fabrication needs hardening and heating the whole assembly would distort it.' },
        { h: 'A surface treatment, not a through one', p: 'Like induction hardening, flame hardening produces a hard case over a core that keeps its original toughness. The depth depends on the flame, the traverse speed and the material, and it is generally deeper and less tightly controlled than an induction case. Where a drawing calls for a precise, shallow case on a part that will fit a coil, induction is the better answer.', link: { href: 'induction-hardening', text: 'Compare with induction hardening' } },
        { h: 'What suits it', p: 'Medium-carbon and alloy steels with enough carbon to harden, typically 0.40 percent and above, and some cast irons. As with any surface hardening route, the material has to be capable of the result before the process can deliver it.' },
      ],
      capacity: [
        ['Suits', 'Components too large for furnace or coil'],
        ['Typical work', 'Ring gears, wheels, tracks, slideways'],
        ['Materials', 'Medium-carbon and alloy steels'],
      ],
      faq: [
        ['How large a component can you flame harden?', 'Size is far less of a constraint than with furnace or induction work, because the equipment goes to the part. Send the drawing and we will confirm.'],
        ['Is flame hardening less accurate than induction?', 'Case depth is generally deeper and less tightly controlled. Where a part fits a coil and the drawing calls for a precise case, induction hardening is usually the better route.'],
        ['Can you harden only part of a component?', 'Yes, and that is often the reason for choosing it. Only the surface the flame passes over is hardened.'],
      ],
    },

    {
      slug: 'material-testing',
      name: 'Material Testing',
      video: 'riS5mnPgKZ0',
      title: 'Material Testing & NDT in Anand | Met-Test Laboratories',
      desc: 'Mechanical and non-destructive testing in-house: 40 tonne UTM, Brinell, Rockwell, ultrasonic, magnetic particle and dye penetrant. Anand, Gujarat.',
      lede: 'Heat treatment without verification is an assumption. Our laboratory sits on the same floor as the furnaces, which means hardness, mechanical properties and internal soundness are confirmed on the treated part before it is released, and every figure that appears on a certificate traces back to an instrument you can come and look at.',
      sections: [
        { h: 'Mechanical testing', p: 'A 40 tonne universal testing machine for tensile and mechanical property confirmation. Hardness across the range that matters in practice: Brinell to three tonnes for castings and forgings, Rockwell to 500 kg for finished and case-hardened work, and portable dynamic and Poldi testers for pieces too large to bring to a bench.' },
        { h: 'Non-destructive testing', p: 'Ultrasonic flaw detection with an Einstein-II DGS set, for sub-surface defects and internal soundness. Magnetic particle inspection on a Magnaflux Y2 for surface and near-surface cracks in ferrous work. Dye penetrant for surface-breaking defects on finished components, including non-ferrous.' },
        { h: 'Testing as a service in its own right', p: 'The laboratory is not reserved for our own heat treatment work. If you need a hardness survey, a tensile result or an NDT report on components treated elsewhere, or on material you are about to buy, send them in with the specification you are testing against.', link: { href: 'process', text: 'How results reach your certificate' } },
      ],
      capacity: [
        ['Universal testing machine', '40 tonne'],
        ['Brinell', 'to 3 tonne'],
        ['Rockwell', 'to 500 kg'],
        ['Ultrasonic', 'Einstein-II DGS'],
        ['Magnetic particle', 'Magnaflux Y2'],
        ['Dye penetrant', 'Surface-breaking defects'],
      ],
      faq: [
        ['Can you test parts you did not heat treat?', 'Yes. The laboratory takes third-party work. Send the components with the specification you want them tested against.'],
        ['What do I receive with the results?', 'A QA and test report with the measured values, and a certificate of conformity stating the result against your specification.'],
        ['Can you test on site?', 'Portable dynamic and Poldi hardness testers cover work too large to move. Ask at enquiry and we will tell you what is practical for your component.'],
      ],
    },
  ],
};
