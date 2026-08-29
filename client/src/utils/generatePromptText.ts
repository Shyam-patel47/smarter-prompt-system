export interface PromptFields {
  taskType: string;
  detailsInput: string;
  tone: string;
  outputFormat: string;
  variables: string[]; // Just the keys for generation
}

export const generatePromptText = (fields: PromptFields): string => {
  const { taskType, detailsInput, tone, outputFormat, variables } = fields;
  
  let prompt = '';

  // 1. Task Type & Variables
  if (taskType) {
    prompt += `Write a ${taskType}`;
  } else {
    prompt += `Write content`;
  }

  if (variables && variables.length > 0) {
    const formattedVars = variables.map(v => `{${v}}`);
    if (formattedVars.length === 1) {
      prompt += ` for ${formattedVars[0]}.\n\n`;
    } else if (formattedVars.length === 2) {
      prompt += ` for ${formattedVars[0]} and ${formattedVars[1]}.\n\n`;
    } else {
      const lastVar = formattedVars.pop();
      prompt += ` for ${formattedVars.join(', ')}, and ${lastVar}.\n\n`;
    }
  } else {
    prompt += `.\n\n`;
  }

  // 2. Details
  if (detailsInput) {
    prompt += `${detailsInput.trim()}\n\n`;
  }

  // 3. Tone
  if (tone) {
    prompt += `Use a ${tone.toLowerCase()} tone.\n\n`;
  }

  // 4. Output Format
  if (outputFormat) {
    prompt += `Format the output as ${outputFormat.toLowerCase()}.\n`;
  }

  return prompt.trim();
};
