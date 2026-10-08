/**
 * The mobile timeline.
 *
 * Today this is the model only (`./model`): lane layout, the move / trim /
 * pinch reducers and the command applier, all platform-free and tested in
 * Node. The `<Timeline>` component that renders lanes with Reanimated and
 * wires react-native-gesture-handler recognisers to these reducers is the
 * RN-T3 .. RN-T7 workstreams in `docs/react-native/04-workstreams.md`.
 */
export * from './model'
