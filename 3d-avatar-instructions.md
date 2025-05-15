# Creating a Custom 3D Avatar for Swisscom AI Assistant

This document provides instructions on how to create and integrate a custom 3D avatar similar to the reference images.

## Prerequisites

- Blender (for 3D modeling and rigging)
- Basic knowledge of 3D modeling concepts
- Three.js and React Three Fiber knowledge

## Step 1: Creating the 3D Model

1. Create a new Blender project
2. Model the character based on the reference images:
   - Create a base mesh for the body
   - Model the face with proper topology for expressions
   - Create the clothing (puffy jacket, cargo pants)
   - Model the hair with a ponytail
   - Add shoes

## Step 2: Rigging the Model

1. Create an armature (skeleton) for the model
2. Add bones for:
   - Spine, neck, head
   - Arms and legs
   - Facial bones for expressions (jaw, eyebrows, eyelids)
3. Weight paint the model to associate vertices with bones
4. Create shape keys for facial expressions:
   - Neutral
   - Happy
   - Thinking
   - Speaking

## Step 3: Creating Animations

1. Create basic animations:
   - Idle pose with subtle movement
   - Speaking animation for mouth
   - Happy expression
   - Thinking expression
2. Export animations as separate actions

## Step 4: Exporting the Model

1. Prepare the model for export:
   - Optimize mesh (reduce polygon count if needed)
   - Apply modifiers
   - Set origin point
2. Export as GLTF/GLB format with these settings:
   - Include: Selected Objects, Armatures, Shape Keys
   - Transform: +Y Up
   - Animation: Include animations, Limit to playback range

## Step 5: Integration with React Three Fiber

1. Place the exported GLB file in the `/public/assets/3d/` directory
2. Use the `AdvancedAvatar` component provided in this project
3. Customize the component to match your model's specific bone names and animations

## Reference

For more detailed implementation, refer to the GitHub repository:
[3D-Avatar-React-Threejs](https://github.com/mahakPandeyOfficial/3D-Avatar-React-Threejs)

## Tips for Better Performance

1. Keep the polygon count low (under 50k triangles)
2. Use texture maps instead of geometry for details
3. Optimize animations to use as few keyframes as possible
4. Use draco compression when exporting GLTF files
\`\`\`

Let's update the page to use our new avatar component:
