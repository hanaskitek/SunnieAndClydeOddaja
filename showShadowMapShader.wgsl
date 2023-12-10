struct VertexInput {
    @location(0) position : vec2f,
    @location(1) texcoords : vec2f,
}

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) texcoords : vec2f,
}

struct FragmentInput {
    @location(0) texcoords : vec2f,
}

struct FragmentOutput {
    @location(0) color : vec4f,
}

// struct Uniforms {
//     translation : vec2f,
// }

// @group(0) @binding(0) var<uniform> uniforms : Uniforms;
@group(0) @binding(0) var uTexture : texture_depth_2d;
@group(0) @binding(1) var uSampler : sampler;

@vertex
fn vertex(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.position = vec4(input.position, 0, 1);
    output.texcoords = input.texcoords;
    return output;
}

@fragment
fn fragment(input : FragmentInput) -> FragmentOutput {
    var output : FragmentOutput;
    var barva = textureSample(uTexture, uSampler, input.texcoords);
    output.color = vec4(barva, barva,barva, 1.0);
    return output;
}
