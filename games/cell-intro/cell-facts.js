/* Shared first-encounter wording for any starting cell. */
export const DNA_INSTRUCTIONS='DNA (deoxyribonucleic acid) is a molecule that stores genetic instructions, including instructions for making proteins.';
export const PROTEIN_JOB='Proteins are molecules that do many jobs in cells.';
export const cellFacts={
 nucleus:{name:'Nucleus',text:`The nucleus holds most of this cell’s DNA. ${DNA_INSTRUCTIONS} A boundary made of two thin membranes, called the nuclear envelope, surrounds the nucleus.`},
 cytoplasm:{name:'Cytoplasm',text:'Cytoplasm is the material inside the cell membrane, outside the nucleus when a cell has one. It includes fluid and many structures that help the cell work. Many essential activities, including making proteins, happen here.'},
 ribosomes:{name:'Ribosomes',text:`Ribosomes are small structures that make proteins. ${PROTEIN_JOB} Ribosomes join small building blocks, called amino acids, to build a protein.`}
};

export const CHROMATIN_DEFINITION=DNA_INSTRUCTIONS+' Inside the nucleus, long DNA molecules are folded and packed together with proteins. This combination of DNA and proteins is called chromatin.';
export const NUCLEOLUS_FUNCTION='The darker region is the nucleolus. Here, the cell makes ribosomal RNA and assembles the parts of ribosomes.';
