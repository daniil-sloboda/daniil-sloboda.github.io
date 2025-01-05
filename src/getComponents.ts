import {Compound, Dataset, Identifier, ProductCompound, Reaction} from "./types";

function getCompoundDrawInfo(compound: Compound | ProductCompound): string | null {
    const molfile = compound.identifiersList.find((item: Identifier) => item.type === 4);
    const smiles = compound.identifiersList.find((item: Identifier) => item.type === 2);
    if (molfile) {
        return molfile.value;
    }
    if (smiles) {
        return smiles.value.replace(/\n/g,'');
    }
    return null;
}

function getReactionCompounds(reaction: Reaction): Array<Compound | ProductCompound> {
    return (reaction.inputsMap.map(
        item => item[1].componentsList
    ) as Array<Array<Compound | ProductCompound>>).concat(
        reaction.outcomesList.map(item => item.productsList)
    ).reduce((acc, item) => acc.concat(item), []);
}


export function getComponents(dataset: Dataset): Set<string> {
    return dataset.reactionsList.reduce((acc: Set<string>, reaction: Reaction) => {
        const compounds = getReactionCompounds(reaction);
        const drawInfoSet = new Set<string>();
        compounds.forEach(compound => {
            const drawInfo = getCompoundDrawInfo(compound);
            if (drawInfo) {
                drawInfoSet.add(drawInfo);
            }
        });
        return acc.union(drawInfoSet);
    }, new Set<string>());
}